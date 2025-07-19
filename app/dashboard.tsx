import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '@expo/vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';

const StatCard = ({ title, value, iconName, color }) => (
  <View style={styles.statCard}>
    <View>
      <Text style={styles.statCardTitle}>{title}</Text>
      <Text style={styles.statCardValue}>{value}</Text>
    </View>
    <Icon name={iconName} size={28} color={color || Colors.primary} />
  </View>
);

const AttendanceItem = ({ record }) => (
  <View style={styles.recordItem}>
    <View style={styles.recordLeft}>
      <View style={[styles.avatar, {backgroundColor: Colors.primaryLight}]}>
        <Text style={[styles.avatarText, {color: Colors.primary}]}>
          {record.name ? record.name.split(' ').map(n => n[0]).join('') : '?'}
        </Text>
      </View>
      <View>
        <Text style={styles.recordName}>{record.name}</Text>
        <Text style={styles.recordDetails}>
          {record.studentId} • {record.class}{record.section ? `-${record.section}` : ""}
        </Text>
      </View>
    </View>
    <View style={styles.recordRight}>
        <View style={[styles.badge, record.attendanceType === 'in' ? styles.inBadge : styles.outBadge]}>
            <Icon name={record.attendanceType === 'in' ? 'log-in' : 'log-out'} size={12} color={Colors.textOnPrimary} />
            <Text style={styles.badgeText}>{record.attendanceType === 'in' ? 'Entry' : 'Exit'}</Text>
        </View>
        <Text style={styles.recordDetails}>{record.time}</Text>
    </View>
  </View>
);

export default function DashboardScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select(`*, students ( student_id, name, class, section )`)
        .eq('attendance_date', dateString)
        .order('attendance_time', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(record => ({
        studentId: record.students.student_id,
        name: record.students.name,
        class: record.students.class,
        section: record.students.section,
        time: record.attendance_time,
        attendanceType: record.attendance_type || 'in',
      }));
      setAttendanceRecords(formattedData);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch attendance data.');
    } finally {
      setLoading(false);
    }
  };
  
  const filteredAttendance = attendanceRecords.filter(record =>
    (record.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.studentId || '').toString().includes(searchTerm)
  );

  const onDateChange = (event: any, newDate?: Date) => {
    const currentDate = newDate || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };
  
  const handleExport = async () => {
    const header = "Student ID,Name,Class,Section,Time,Type\n";
    const rows = filteredAttendance.map(r => 
      `${r.studentId},${r.name},${r.class},${r.section},${r.time},${r.attendanceType}`
    ).join("\n");
    
    if (filteredAttendance.length === 0) {
        Alert.alert("No Data", "There is no data to export.");
        return;
    }

    const csvContent = header + rows;
    const dateString = selectedDate.toISOString().split('T')[0];
    const filename = FileSystem.documentDirectory + `attendance_${dateString}.csv`;
    
    try {
        await FileSystem.writeAsStringAsync(filename, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(filename);
        }
    } catch(error) {
        Alert.alert("Export Error", "Failed to export data.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={handleExport}>
          <Icon name="download" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.padding}>
          <View style={styles.statsGrid}>
            <StatCard title="Present Today" value={filteredAttendance.length} iconName="check-circle" color={Colors.success} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Filters</Text>
            <View style={styles.searchInputContainer}>
                <Icon name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
                <TextInput placeholder="Search by name or ID..." style={styles.searchInput} value={searchTerm} onChangeText={setSearchTerm}/>
            </View>
            <TouchableOpacity style={styles.dateInputContainer} onPress={() => setShowDatePicker(true)}>
                <Icon name="calendar" size={20} color={Colors.textSecondary} />
                <Text style={styles.dateText}>{selectedDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && ( <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} /> )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attendance Records ({filteredAttendance.length})</Text>
            {loading ? ( <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 20}}/> ) 
             : ( filteredAttendance.length > 0 ? (
                    filteredAttendance.map((item, index) => <AttendanceItem key={index} record={item} />)
                 ) : ( <Text style={styles.noRecordsText}>No records found.</Text> )
            )}
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  padding: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { width: '100%', backgroundColor: Colors.surface, borderRadius: 12, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statCardTitle: { fontSize: 14, color: Colors.textSecondary },
  statCardValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: Colors.text },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16, color: Colors.text },
  dateInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: Colors.border },
  dateText: { marginLeft: 8, fontSize: 16, color: Colors.text },
  noRecordsText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 20, fontSize: 16 },
  recordItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  recordLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: Colors.primary, fontWeight: 'bold' },
  recordName: { fontSize: 16, fontWeight: '500', color: Colors.text },
  recordDetails: { fontSize: 14, color: Colors.textSecondary },
  recordRight: { alignItems: 'flex-end' },
  badge: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignItems: 'center', marginBottom: 4 },
  inBadge: { backgroundColor: Colors.success },
  outBadge: { backgroundColor: Colors.danger },
  badgeText: { color: Colors.textOnPrimary, fontSize: 12, marginLeft: 4, fontWeight: '500' },
});