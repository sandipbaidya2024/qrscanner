import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, FlatList, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '@expo/vector-icons/Feather';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import SingleQRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import { Colors } from '../constants/Colors';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import QRCode from 'qrcode';

const defaultStudent = { name: '', student_id: '', class: '', section: '', parent_phone: '' };

export default function AdminScreen() {
    const router = useRouter();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [selectedStudentForQR, setSelectedStudentForQR] = useState<any | null>(null);
    const singleQrCodeRef = useRef(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            fetchStudents();
        }
    }, [session]);

    const fetchStudents = async () => {
        setListLoading(true);
        const { data, error } = await supabase.from('students').select('*').order('name', { ascending: true });
        if (error) { Alert.alert('Error', 'Failed to fetch students.'); }
        else { setStudents(data || []); }
        setListLoading(false);
    };

    const handleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) Alert.alert('Login Failed', error.message);
        setLoading(false);
    };

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setLoading(false);
    };
    
    const openStudentForm = (student: any | null = null) => {
        setStudentToEdit(student ? { ...student } : defaultStudent);
        setModalVisible(true);
    };

    const handleSaveStudent = async () => {
        if (!studentToEdit?.name || !studentToEdit?.student_id || !studentToEdit?.class || !studentToEdit?.parent_phone) {
            Alert.alert('Invalid Input', "All fields except Section are required.");
            return;
        }
        setIsSaving(true);
        const { id, created_at, ...studentData } = studentToEdit;
        
        let error;
        if (id) {
            const { error: updateError } = await supabase.from('students').update(studentData).eq('id', id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('students').insert([studentData]);
            error = insertError;
        }
        setIsSaving(false);

        if (error) { Alert.alert('Error', 'Failed to save student: ' + error.message); } 
        else {
            Alert.alert('Success', `Student data has been ${id ? 'updated' : 'added'} successfully!`);
            setModalVisible(false);
            fetchStudents();
        }
    };
    
    const confirmDeleteStudent = (student: any) => {
        Alert.alert( "Confirm Delete", `Are you sure you want to delete ${student.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDeleteStudent(student.id) }
            ]
        );
    };

    const handleDeleteStudent = async (studentId: number) => {
        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) { Alert.alert('Error', 'Failed to delete student: ' + error.message); }
        else {
            Alert.alert('Success', 'Student has been deleted.');
            fetchStudents();
        }
    };
    
    const handleStudentPress = (student: any) => {
        Alert.alert( student.name, "Choose an action",
            [
                { text: "View QR Code", onPress: () => { setSelectedStudentForQR(student); setQrModalVisible(true); } },
                { text: "Edit Student", onPress: () => openStudentForm(student) },
                { text: "Delete", style: "destructive", onPress: () => confirmDeleteStudent(student) },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleDownloadTemplate = async () => {
        const header = "name,student_id,class,section,parent_phone\n";
        const exampleRow = "John Doe,101,10,A,9876543210\n";
        const csvContent = header + exampleRow;
        
        const filename = FileSystem.documentDirectory + "student_template.csv";
        
        try {
            await FileSystem.writeAsStringAsync(filename, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filename, { mimeType: 'text/csv', dialogTitle: 'Download Student Template' });
            } else { Alert.alert("Sharing not available"); }
        } catch(error) { Alert.alert("Download Error", "Failed to create template file."); }
    };

    const handleFileUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
            if (result.canceled || !result.assets) return;

            setIsUploading(true);
            const fileUri = result.assets[0].uri;
            const fileContent = await FileSystem.readAsStringAsync(fileUri);

            Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                complete: async (parseResult) => {
                    const studentsToUpload = parseResult.data;
                    if (studentsToUpload.length === 0) {
                        Alert.alert("Empty File", "The selected CSV file has no data.");
                        setIsUploading(false);
                        return;
                    }
                    const { error } = await supabase.from('students').insert(studentsToUpload as any);
                    setIsUploading(false);
                    if (error) { Alert.alert("Upload Error", `Failed to upload students: ${error.message}`); } 
                    else {
                        Alert.alert("Upload Successful", `${studentsToUpload.length} students have been added.`);
                        fetchStudents();
                    }
                },
                error: (error) => { setIsUploading(false); Alert.alert("Parsing Error", `Failed to parse CSV file: ${error.message}`); }
            });
        } catch (err) { setIsUploading(false); Alert.alert("Error", "An unexpected error occurred."); }
    };
    
    const handleDownloadSingleQrCode = async () => {
        if (!singleQrCodeRef.current || !selectedStudentForQR) return;
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need permissions to save to your photo gallery.');
            return;
        }
        (singleQrCodeRef.current as any).toDataURL(async (data: string) => {
            const filename = FileSystem.documentDirectory + `${selectedStudentForQR.student_id}_qr.png`;
            try {
                await FileSystem.writeAsStringAsync(filename, data, { encoding: FileSystem.EncodingType.Base64 });
                await MediaLibrary.createAssetAsync(filename);
                Alert.alert('Success', 'QR Code saved to photo gallery!');
            } catch (error) { Alert.alert('Error', 'Failed to save QR code.'); }
        });
    };
    
  
    const handleBulkDownloadQRCodes = async () => {
        if (students.length === 0) {
            Alert.alert("No Students", "There are no students to generate QR codes for.");
            return;
        }
        setIsUploading(true);
        try {
            const qrCodePromises = students.map(student => QRCode.toString(student.student_id.toString(), { type: 'svg', errorCorrectionLevel: 'M', margin: 2 }));
            const qrCodeSVGs = await Promise.all(qrCodePromises);
            const htmlContent = `
                <html><head><style>body{font-family:sans-serif;}.page-container{display:grid;grid-template-columns:1fr 1fr 1fr;grid-auto-rows:min-content;gap:30px 15px;padding:20px;}.card{border:1px solid #ddd;border-radius:8px;padding:10px;text-align:center;overflow:hidden;}.qr-svg{width:100%;height:auto;}.name{font-weight:bold;font-size:14px;margin-top:5px;word-wrap:break-word;}.id{font-size:12px;color:#555;}</style></head>
                <body><div class="page-container">${students.map((student, index) => `<div class="card">${qrCodeSVGs[index].replace('<?xml version="1.0" standalone="no"?>', '').replace(/width="[0-9]+"/, 'class="qr-svg"').replace(/height="[0-9]+"/, '')}<div class="name">${student.name}</div><div class="id">ID: ${student.student_id}</div></div>`).join('')}</div></body>
                </html>`;

            const options = { html: htmlContent, fileName: 'Student_QR_Codes', directory: 'Documents' };
            const file = await RNHTMLtoPDF.convert(options);
            if (file.filePath) {
                await Sharing.shareAsync(file.filePath);
            } else {
                throw new Error("PDF file was not created.");
            }
        } catch (error: any) {
            Alert.alert("PDF Generation Error", `An error occurred: ${error.message}`);
        } 
        finally {
            setIsUploading(false);
        }
    };

    const StudentItem = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => handleStudentPress(item)}>
            <View style={styles.studentItem}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{item.name ? item.name.charAt(0) : '?'}</Text></View>
                <View><Text style={styles.studentName}>{item.name || 'No Name'}</Text><Text style={styles.studentDetails}>ID: {item.student_id} | Class: {item.class}</Text></View>
            </View>
        </TouchableOpacity>
    );

    if (loading) { return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>; }
    
    if (!session) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}><Text style={styles.title}>Admin Login</Text></View>
                <View style={styles.formContainer}>
                    <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                    <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
                    <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>{loading ? <ActivityIndicator color={Colors.textOnPrimary} /> : <Text style={styles.buttonText}>Login</Text>}</TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{studentToEdit?.id ? 'Edit Student' : 'Add New Student'}</Text>
                        <TextInput style={styles.input} placeholder="Full Name" value={studentToEdit?.name || ''} onChangeText={(text) => setStudentToEdit({...studentToEdit, name: text})} />
                        <TextInput style={styles.input} placeholder="Student ID" value={studentToEdit?.student_id || ''} onChangeText={(text) => setStudentToEdit({...studentToEdit, student_id: text})} />
                        <TextInput style={styles.input} placeholder="Class" value={studentToEdit?.class || ''} onChangeText={(text) => setStudentToEdit({...studentToEdit, class: text})} />
                        <TextInput style={styles.input} placeholder="Section (Optional)" value={studentToEdit?.section || ''} onChangeText={(text) => setStudentToEdit({...studentToEdit, section: text})} />
                        <TextInput style={styles.input} placeholder="Parent's Phone Number" value={studentToEdit?.parent_phone || ''} onChangeText={(text) => setStudentToEdit({...studentToEdit, parent_phone: text})} keyboardType="phone-pad" />
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={handleSaveStudent} disabled={isSaving}>{isSaving ? <ActivityIndicator color={Colors.textOnPrimary} /> : <Text style={styles.buttonText}>Save</Text>}</TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            
            <Modal visible={qrModalVisible} onRequestClose={() => setQrModalVisible(false)} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedStudentForQR && <>
                            <Text style={styles.modalTitle}>{selectedStudentForQR.name}</Text>
                            <View style={styles.qrContainer}><SingleQRCode value={selectedStudentForQR.student_id.toString()} size={220} getRef={singleQrCodeRef} /></View>
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity style={[styles.button, styles.downloadButton]} onPress={handleDownloadSingleQrCode}><Icon name="download" size={16} color={Colors.textOnPrimary} /><Text style={[styles.buttonText, {marginLeft: 8}]}>Save</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setQrModalVisible(false)}><Text style={styles.cancelButtonText}>Close</Text></TouchableOpacity>
                            </View>
                        </>}
                    </View>
                </View>
            </Modal>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.text} /></TouchableOpacity>
                <Text style={styles.title}>Admin Panel</Text>
                <TouchableOpacity onPress={handleLogout}><Icon name="log-out" size={24} color={Colors.danger} /></TouchableOpacity>
            </View>
      
            <FlatList
                data={students}
                renderItem={StudentItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ListHeaderComponent={
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Bulk Operations</Text>
                        <TouchableOpacity style={styles.bulkButton} onPress={handleDownloadTemplate}><Icon name="download" size={20} color={Colors.textOnPrimary} /><Text style={styles.bulkButtonText}>Download CSV Template</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.bulkButton, {backgroundColor: Colors.success, marginTop: 10}]} onPress={handleFileUpload} disabled={isUploading}>{isUploading ? <ActivityIndicator color={Colors.textOnPrimary} /> : <><Icon name="upload" size={20} color={Colors.textOnPrimary} /><Text style={styles.bulkButtonText}>Upload CSV File</Text></>}</TouchableOpacity>
                        <TouchableOpacity style={[styles.bulkButton, {backgroundColor: Colors.warning, marginTop: 10}]} onPress={handleBulkDownloadQRCodes} disabled={isUploading}>{isUploading ? <ActivityIndicator color={Colors.textOnPrimary} /> : <><Icon name="grid" size={20} color={Colors.textOnPrimary} /><Text style={styles.bulkButtonText}>Download All QRs</Text></>}</TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={<Text style={styles.emptyText}>{listLoading ? '' : 'No students found.'}</Text>}
                refreshing={listLoading}
                onRefresh={fetchStudents}
            />

            <TouchableOpacity style={styles.fab} onPress={() => openStudentForm()}><Icon name="plus" size={30} color={Colors.textOnPrimary} /></TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
    formContainer: { flex: 1, padding: 20, justifyContent: 'center' },
    input: { height: 50, borderColor: Colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, backgroundColor: Colors.surface, color: Colors.text },
    button: { backgroundColor: Colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', flex: 1, marginHorizontal: 5 },
    buttonText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: 'bold' },
    studentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    avatarText: { color: Colors.primary, fontWeight: 'bold', fontSize: 18 },
    studentName: { fontSize: 16, fontWeight: '600', color: Colors.text },
    studentDetails: { fontSize: 14, color: Colors.textSecondary },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: Colors.textSecondary },
    fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 30, bottom: 30, backgroundColor: Colors.primary, borderRadius: 30, elevation: 8 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { width: '90%', backgroundColor: Colors.surface, borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: Colors.text },
    modalButtonContainer: { flexDirection: 'row', marginTop: 10 },
    cancelButton: { backgroundColor: Colors.cancel },
    cancelButtonText: { color: Colors.cancelText, fontSize: 16, fontWeight: 'bold' },
    card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: Colors.text },
    bulkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
    bulkButtonText: { color: Colors.textOnPrimary, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    qrContainer: { marginTop: 20, padding: 10, backgroundColor: 'white', borderRadius: 5, borderWidth: 1, borderColor: Colors.border },
    downloadButton: { backgroundColor: Colors.primary },
});