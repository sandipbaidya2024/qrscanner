import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
    TextInput, FlatList, ActivityIndicator, Alert 
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';

const sendSmsNotification = async (studentName: string, parentPhone: string, attendanceType: 'in' | 'out') => {
    const SMS_FUNCTION_URL = 'https://gulufjpszyanwfinpwvn.supabase.co/functions/v1/send-sms';
    if (!parentPhone) {
        console.log(`No phone number for ${studentName}. Skipping SMS.`);
        return;
    }
    const action = attendanceType === 'in' ? 'reached the school' : 'left the school';
    const message = `Dear Parent, your child ${studentName} has ${action} at ${new Date().toLocaleTimeString()}. - QuickAttend (Manual Entry)`;
    try {
        await fetch(SMS_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: parentPhone, message }),
        });
    } catch (error) {
        console.error('Failed to call SMS function:', error);
    }
};

export default function ManualEntryScreen() {
  const router = useRouter();
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('students').select('*').order('name', { ascending: true });
        if (data) {
            setAllStudents(data);
            setFilteredStudents(data);
        }
        if(error) {
            Alert.alert("Error", "Could not fetch student list.");
        }
        setIsLoading(false);
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchQuery === '') {
        setFilteredStudents(allStudents);
    } else {
        const lowercasedQuery = searchQuery.toLowerCase();
        const filtered = allStudents.filter(student => 
            student.name.toLowerCase().includes(lowercasedQuery) ||
            student.student_id.toString().includes(lowercasedQuery)
        );
        setFilteredStudents(filtered);
    }
  }, [searchQuery, allStudents]);
  
  const handleSubmitAttendance = async (attendanceType: 'in' | 'out') => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
        const currentDate = new Date();
        const { error } = await supabase.from('attendance').insert({
            student_id: selectedStudent.id,
            attendance_date: currentDate.toISOString().split('T')[0],
            attendance_time: currentDate.toTimeString().split(' ')[0],
            attendance_type: attendanceType,
        });

        if (error) throw error;
        
        await sendSmsNotification(selectedStudent.name, selectedStudent.parent_phone, attendanceType);
        Alert.alert('Success', `Attendance for ${selectedStudent.name} marked as '${attendanceType.toUpperCase()}'.`);
        setSelectedStudent(null);
        setSearchQuery('');

    } catch (e: any) {
        Alert.alert('Error', e.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Manual Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
                placeholder="Search student by name or ID..."
                placeholderTextColor={Colors.textSecondary}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSelectedStudent(null)}
            />
        </View>

        {isLoading ? <ActivityIndicator style={{marginTop: 20}} color={Colors.primary} /> : (
            !selectedStudent && (
                <FlatList
                    data={filteredStudents}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.studentItem} onPress={() => {
                            setSelectedStudent(item);
                            setSearchQuery(item.name);
                        }}>
                            <Text style={styles.studentName}>{item.name}</Text>
                            <Text style={styles.studentDetails}>ID: {item.student_id}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No students found for '{searchQuery}'</Text>}
                    style={{ marginTop: 10 }}
                />
            )
        )}
        
        {selectedStudent && (
            <View style={styles.selectionContainer}>
                <Text style={styles.selectedText}>Selected: 
                    <Text style={{fontWeight: 'bold'}}> {selectedStudent.name}</Text>
                </Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={[styles.markButton, styles.markInButton]}
                        onPress={() => handleSubmitAttendance('in')}
                        disabled={isSubmitting}
                    >
                        <Icon name="log-in" size={20} color={Colors.textOnPrimary} />
                        <Text style={styles.markButtonText}>Mark IN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.markButton, styles.markOutButton]}
                        onPress={() => handleSubmitAttendance('out')}
                        disabled={isSubmitting}
                    >
                         <Icon name="log-out" size={20} color={Colors.textOnPrimary} />
                        <Text style={styles.markButtonText}>Mark OUT</Text>
                    </TouchableOpacity>
                </View>
                {isSubmitting && <ActivityIndicator style={{marginTop: 10}} color={Colors.primary} />}
            </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  content: { flex: 1, padding: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 16, color: Colors.text },
  studentItem: { paddingVertical: 16, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  studentName: { fontSize: 16, fontWeight: '500', color: Colors.text },
  studentDetails: { fontSize: 14, color: Colors.textSecondary },
  emptyText: { textAlign: 'center', marginTop: 20, color: Colors.textSecondary, fontStyle: 'italic' },
  selectionContainer: { marginTop: 20, padding: 20, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  selectedText: { fontSize: 18, textAlign: 'center', marginBottom: 20, color: Colors.text },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  markButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 8, marginHorizontal: 5 },
  markInButton: { backgroundColor: Colors.success },
  markOutButton: { backgroundColor: Colors.danger },
  markButtonText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});