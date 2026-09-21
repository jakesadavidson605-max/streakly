import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLOR_SWATCHES, Habit } from '../storage';

interface Props {
  visible: boolean;
  initial: Habit | null; // null => creating a new habit
  onSave: (fields: { name: string; color: string; goalNote: string }) => void;
  onClose: () => void;
}

export function HabitModal({ visible, initial, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [goalNote, setGoalNote] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setGoalNote(initial?.goalNote ?? '');
      setColor(initial?.color ?? COLOR_SWATCHES[0]);
    }
  }, [visible, initial]);

  const canSave = name.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Text style={styles.title}>{initial ? 'Edit habit' : 'New habit'}</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Read 10 pages"
              placeholderTextColor="#C9A88F"
              maxLength={60}
              autoFocus
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.swatches}>
              {COLOR_SWATCHES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    color === c && styles.swatchSelected,
                  ]}
                />
              ))}
            </View>

            <Text style={styles.label}>Daily goal note (optional)</Text>
            <TextInput
              style={styles.input}
              value={goalNote}
              onChangeText={setGoalNote}
              placeholder="e.g. One chapter before bed"
              placeholderTextColor="#C9A88F"
              maxLength={100}
            />

            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                disabled={!canSave}
                onPress={() => onSave({ name: name.trim(), color, goalNote: goalNote.trim() })}
              >
                <Text style={styles.saveText}>{initial ? 'Save' : 'Add habit'}</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(74, 52, 40, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFDF8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#4A3428', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#A68B76', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#FFF6E9',
    borderWidth: 1,
    borderColor: '#F0DCC3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#4A3428',
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 38, height: 38, borderRadius: 19 },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#4A3428',
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F7EBD9',
  },
  cancelText: { fontSize: 16, fontWeight: '700', color: '#A68B76' },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FF8C42',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
