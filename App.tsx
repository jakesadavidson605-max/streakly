import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AdBanner } from './src/components/AdBanner';
import { HabitModal } from './src/components/HabitModal';
import {
  addDays,
  formatTime,
  startOfWeekSunday,
  todayString,
  toLocalDateString,
  WEEKDAY_LETTERS,
} from './src/dates';
import { bestStreakEver, currentStreak } from './src/streaks';
import {
  Habit,
  ReminderSettings,
  DEFAULT_SETTINGS,
  loadCheckins,
  loadHabits,
  loadSettings,
  newId,
  saveCheckins,
  saveHabits,
  saveSettings,
} from './src/storage';
import {
  cancelDailyReminder,
  ensureReminderChannel,
  requestReminderPermission,
  scheduleDailyReminder,
} from './src/notifications';

const CREAM = '#FFF6E9';
const CARD = '#FFFDF8';
const INK = '#4A3428';
const MUTED = '#A68B76';
const ACCENT = '#FF8C42';
const LINE = '#F0DCC3';

// ---------- 7-day week strip ----------
function WeekStrip({ habits, checkins }: { habits: Habit[]; checkins: Record<string, string[]> }) {
  const days = useMemo(() => {
    const start = startOfWeekSunday(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);
  const today = todayString();
  const shown = habits.slice(0, 6);
  const extra = habits.length - shown.length;

  return (
    <View style={styles.weekStrip}>
      {days.map((d) => {
        const ds = toLocalDateString(d);
        const isToday = ds === today;
        return (
          <View key={ds} style={[styles.weekDay, isToday && styles.weekDayToday]}>
            <Text style={[styles.weekLetter, isToday && styles.weekLetterToday]}>
              {WEEKDAY_LETTERS[d.getDay()]}
            </Text>
            <Text style={[styles.weekNum, isToday && styles.weekNumToday]}>{d.getDate()}</Text>
            <View style={styles.dots}>
              {shown.map((h) => {
                const done = (checkins[h.id] ?? []).includes(ds);
                return (
                  <View
                    key={h.id}
                    style={[
                      styles.dot,
                      { backgroundColor: done ? h.color : 'transparent' },
                      !done && styles.dotEmpty,
                    ]}
                  />
                );
              })}
              {extra > 0 && <Text style={styles.dotsMore}>+{extra}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------- Stats ----------
function StatsRow({
  total,
  best,
  active,
}: {
  total: number;
  best: number;
  active: number;
}) {
  const items = [
    { label: 'Check-ins', value: String(total), icon: '✅' },
    { label: 'Best streak', value: `${best}d`, icon: '🏆' },
    { label: 'Active', value: String(active), icon: '🔥' },
  ];
  return (
    <View style={styles.statsRow}>
      {items.map((it) => (
        <View key={it.label} style={styles.statCard}>
          <Text style={styles.statIcon}>{it.icon}</Text>
          <Text style={styles.statValue}>{it.value}</Text>
          <Text style={styles.statLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------- Habit card ----------
function HabitCard({
  habit,
  checkedToday,
  streak,
  onToggle,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  checkedToday: boolean;
  streak: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.card, checkedToday && styles.cardDone]}>
      <View style={[styles.cardStripe, { backgroundColor: habit.color }]} />
      <TouchableOpacity
        style={styles.cardMain}
        activeOpacity={0.75}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${checkedToday ? 'checked in' : 'not checked in'} today`}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardText}>
            <Text style={styles.cardName} numberOfLines={2}>
              {habit.name}
            </Text>
            {!!habit.goalNote && (
              <Text style={styles.cardNote} numberOfLines={2}>
                {habit.goalNote}
              </Text>
            )}
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.flame}>{streak > 0 ? '🔥' : '·'}</Text>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>{streak === 1 ? 'day' : 'days'}</Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View style={[styles.checkPill, checkedToday && styles.checkPillDone]}>
            <Text style={[styles.checkPillText, checkedToday && styles.checkPillTextDone]}>
              {checkedToday ? '✓ Done today — tap to undo' : 'Tap to check in'}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={onEdit} hitSlop={8}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} hitSlop={8}>
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ---------- Time picker ----------
function TimePickerModal({
  visible,
  hour24,
  minute,
  onSave,
  onClose,
}: {
  visible: boolean;
  hour24: number;
  minute: number;
  onSave: (h: number, m: number) => void;
  onClose: () => void;
}) {
  const [h12, setH12] = useState(8);
  const [min, setMin] = useState(0);
  const [pm, setPm] = useState(true);

  useEffect(() => {
    if (visible) {
      setPm(hour24 >= 12);
      const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
      setH12(h);
      setMin(minute);
    }
  }, [visible, hour24, minute]);

  const stepper = (label: string, value: string, onMinus: () => void, onPlus: () => void) => (
    <View style={styles.stepCol}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepRow}>
        <Pressable style={styles.stepBtn} onPress={onMinus}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable style={styles.stepBtn} onPress={onPlus}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.tpBackdrop} onPress={onClose}>
        <Pressable style={styles.tpSheet} onPress={() => {}}>
          <Text style={styles.tpTitle}>Reminder time</Text>
          <View style={styles.tpRow}>
            {stepper('Hour', String(h12), () => setH12(h12 === 1 ? 12 : h12 - 1), () =>
              setH12(h12 === 12 ? 1 : h12 + 1),
            )}
            {stepper(
              'Min',
              String(min).padStart(2, '0'),
              () => setMin((min + 55) % 60),
              () => setMin((min + 5) % 60),
            )}
            <View style={styles.stepCol}>
              <Text style={styles.stepLabel}>AM/PM</Text>
              <Pressable style={styles.ampmBtn} onPress={() => setPm(!pm)}>
                <Text style={styles.ampmText}>{pm ? 'PM' : 'AM'}</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.saveBtn}
              onPress={() => onSave(pm ? (h12 % 12) + 12 : h12 % 12, min)}
            >
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------- App ----------
export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<Record<string, string[]>>({});
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [timeVisible, setTimeVisible] = useState(false);
  const [permissionNote, setPermissionNote] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [h, c, s] = await Promise.all([loadHabits(), loadCheckins(), loadSettings()]);
      setHabits(h);
      setCheckins(c);
      setSettings(s);
      setLoaded(true);
      // Make sure the Android channel exists; reschedule if the user left it on.
      await ensureReminderChannel();
      if (s.enabled) {
        await scheduleDailyReminder(s.hour, s.minute);
      }
    })();
  }, []);

  const persistHabits = (h: Habit[]) => {
    setHabits(h);
    void saveHabits(h);
  };
  const persistCheckins = (c: Record<string, string[]>) => {
    setCheckins(c);
    void saveCheckins(c);
  };
  const persistSettings = (s: ReminderSettings) => {
    setSettings(s);
    void saveSettings(s);
  };

  const toggleCheckin = (habitId: string) => {
    const today = todayString();
    const dates = checkins[habitId] ?? [];
    const next = dates.includes(today) ? dates.filter((d) => d !== today) : [...dates, today];
    persistCheckins({ ...checkins, [habitId]: next });
  };

  const openNew = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const saveHabit = (fields: { name: string; color: string; goalNote: string }) => {
    if (editing) {
      persistHabits(habits.map((h) => (h.id === editing.id ? { ...h, ...fields } : h)));
    } else {
      const habit: Habit = {
        id: newId(),
        createdAt: new Date().toISOString(),
        ...fields,
      };
      persistHabits([...habits, habit]);
    }
    setModalVisible(false);
    setEditing(null);
  };

  const deleteHabit = (habit: Habit) => {
    Alert.alert('Delete habit?', `"${habit.name}" and its history will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          persistHabits(habits.filter((h) => h.id !== habit.id));
          const c = { ...checkins };
          delete c[habit.id];
          persistCheckins(c);
        },
      },
    ]);
  };

  const setReminderEnabled = async (on: boolean) => {
    if (on) {
      const granted = await requestReminderPermission();
      if (!granted) {
        setPermissionNote(
          'Notifications are blocked — enable them in system settings to get reminders.',
        );
        return;
      }
      await scheduleDailyReminder(settings.hour, settings.minute);
      persistSettings({ ...settings, enabled: true });
      setPermissionNote(null);
    } else {
      await cancelDailyReminder();
      persistSettings({ ...settings, enabled: false });
    }
  };

  const saveReminderTime = async (hour: number, minute: number) => {
    const s = { ...settings, hour, minute };
    persistSettings(s);
    if (s.enabled) {
      await scheduleDailyReminder(hour, minute);
    }
    setTimeVisible(false);
  };

  const stats = useMemo(() => {
    let total = 0;
    let best = 0;
    let active = 0;
    for (const h of habits) {
      const dates = checkins[h.id] ?? [];
      total += new Set(dates).size;
      const b = bestStreakEver(dates);
      if (b > best) best = b;
      if (currentStreak(dates) > 0) active += 1;
    }
    return { total, best, active };
  }, [habits, checkins]);

  const today = todayString();

  if (!loaded) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Streakly 🔥</Text>
            <Text style={styles.subtitle}>Small wins, every day.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openNew} accessibilityLabel="Add habit">
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>

        <WeekStrip habits={habits} checkins={checkins} />
        <StatsRow total={stats.total} best={stats.best} active={stats.active} />

        <Text style={styles.sectionTitle}>Your habits</Text>
        {habits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyText}>
              No habits yet.{'\n'}Tap ＋ to start your first streak!
            </Text>
          </View>
        ) : (
          habits.map((h) => {
            const dates = checkins[h.id] ?? [];
            return (
              <HabitCard
                key={h.id}
                habit={h}
                checkedToday={dates.includes(today)}
                streak={currentStreak(dates)}
                onToggle={() => toggleCheckin(h.id)}
                onEdit={() => {
                  setEditing(h);
                  setModalVisible(true);
                }}
                onDelete={() => deleteHabit(h)}
              />
            );
          })
        )}

        <Text style={styles.sectionTitle}>Reminder</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsText}>
              <Text style={styles.settingsTitle}>Daily reminder</Text>
              <Text style={styles.settingsSub}>
                {settings.enabled
                  ? `On — ${formatTime(settings.hour, settings.minute)}`
                  : 'Off'}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: '#EBDCC8', true: ACCENT }}
              thumbColor="#FFFFFF"
            />
          </View>
          <TouchableOpacity style={styles.timeBtn} onPress={() => setTimeVisible(true)}>
            <Text style={styles.timeBtnText}>
              🕗 Change time ({formatTime(settings.hour, settings.minute)})
            </Text>
          </TouchableOpacity>
          {!!permissionNote && <Text style={styles.permissionNote}>{permissionNote}</Text>}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <AdBanner />

      <HabitModal
        visible={modalVisible}
        initial={editing}
        onSave={saveHabit}
        onClose={() => {
          setModalVisible(false);
          setEditing(null);
        }}
      />
      <TimePickerModal
        visible={timeVisible}
        hour24={settings.hour}
        minute={settings.minute}
        onSave={saveReminderTime}
        onClose={() => setTimeVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  scroll: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 30, fontWeight: '900', color: INK },
  subtitle: { fontSize: 14, color: MUTED, marginTop: 2 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  addBtnText: { fontSize: 26, color: '#fff', fontWeight: '800', lineHeight: 28 },
  weekStrip: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LINE,
  },
  weekDay: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 12 },
  weekDayToday: { backgroundColor: '#FFE9D4' },
  weekLetter: { fontSize: 11, fontWeight: '700', color: MUTED },
  weekLetterToday: { color: ACCENT },
  weekNum: { fontSize: 15, fontWeight: '800', color: INK, marginTop: 2 },
  weekNumToday: { color: ACCENT },
  dots: { flexDirection: 'row', marginTop: 6, minHeight: 10, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 1.5 },
  dotEmpty: { borderWidth: 1, borderColor: '#E3CDAF' },
  dotsMore: { fontSize: 9, color: MUTED, marginLeft: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LINE,
  },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 20, fontWeight: '900', color: INK, marginTop: 2 },
  statLabel: { fontSize: 11, fontWeight: '700', color: MUTED, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: INK, marginBottom: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LINE,
    overflow: 'hidden',
    minHeight: 104,
  },
  cardDone: { borderColor: ACCENT, borderWidth: 1.5 },
  cardStripe: { width: 8 },
  cardMain: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardText: { flex: 1, marginRight: 10 },
  cardName: { fontSize: 17, fontWeight: '800', color: INK },
  cardNote: { fontSize: 13, color: MUTED, marginTop: 3 },
  cardRight: { alignItems: 'center', minWidth: 52 },
  flame: { fontSize: 24 },
  streakNum: { fontSize: 22, fontWeight: '900', color: INK },
  streakLabel: { fontSize: 11, fontWeight: '700', color: MUTED },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  checkPill: {
    backgroundColor: '#FFF1E0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  checkPillDone: { backgroundColor: ACCENT },
  checkPillText: { fontSize: 12, fontWeight: '800', color: ACCENT },
  checkPillTextDone: { color: '#fff' },
  cardActions: { flexDirection: 'row', gap: 14 },
  actionText: { fontSize: 13, fontWeight: '700', color: MUTED },
  deleteText: { color: '#D64545' },
  emptyCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: MUTED, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  settingsCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    padding: 16,
  },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingsText: { flex: 1 },
  settingsTitle: { fontSize: 16, fontWeight: '800', color: INK },
  settingsSub: { fontSize: 13, color: MUTED, marginTop: 2 },
  timeBtn: {
    marginTop: 12,
    backgroundColor: '#FFF1E0',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  timeBtnText: { fontSize: 14, fontWeight: '800', color: ACCENT },
  permissionNote: { fontSize: 12, color: '#B4562F', marginTop: 10, lineHeight: 17 },
  // modal + actions shared
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F7EBD9',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: MUTED },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: ACCENT,
  },
  saveText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  // time picker
  tpBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(74, 52, 40, 0.45)',
    justifyContent: 'center',
    padding: 32,
  },
  tpSheet: { backgroundColor: CARD, borderRadius: 22, padding: 22 },
  tpTitle: { fontSize: 18, fontWeight: '800', color: INK, marginBottom: 6 },
  tpRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  stepCol: { alignItems: 'center' },
  stepLabel: { fontSize: 12, fontWeight: '700', color: MUTED, marginBottom: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, fontWeight: '800', color: ACCENT },
  stepValue: { fontSize: 26, fontWeight: '900', color: INK, minWidth: 44, textAlign: 'center' },
  ampmBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
