import React from 'react';
import { StyleSheet,Image, View, Text, ImageBackground, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import Icon from '@expo/vector-icons/Feather';
import { Colors } from '../constants/Colors';

const heroImage = require('../assets/images/hero-image.jpg');
const logoImage = require('../assets/images/my-logo.png'); 

export default function HeroScreen() {
  return (
    <ImageBackground source={heroImage} style={styles.backgroundImage} imageStyle={{ opacity: 0.15 }} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
  <View style={styles.headerContainer}>
            {/* ২. এখানে <Icon> এর জায়গায় <Image> ব্যবহার করা হয়েছে */}
            <View style={styles.logoBackground}>
              <Image source={logoImage} style={styles.logo} />
            </View>
            <Text style={styles.title}>QuickAttend</Text>
            <Text style={styles.subtitle}>Smart QR-Based Student Attendance System </Text>
			<Text style={styles.subtitle}>powered by BAGU J.B.S</Text>
		  </View>

          <View style={styles.cardContainer}>
            <Link href="/dashboard" asChild>
              <TouchableOpacity style={styles.card}><Icon name="users" size={32} color={Colors.primary} style={styles.cardIcon} /><Text style={styles.cardTitle}>Smart Dashboard</Text><Text style={styles.cardText}>Real-time tracking and analytics</Text></TouchableOpacity>
            </Link>
            <View style={styles.card}><Icon name="clock" size={32} color={Colors.primary} style={styles.cardIcon} /><Text style={styles.cardTitle}>Auto Notifications</Text><Text style={styles.cardText}>Instant SMS alerts to parents</Text></View>
          </View>

          <View style={styles.buttonGroup}>
            <Link href={{ pathname: "/scanner", params: { type: 'in' } }} asChild>
              <TouchableOpacity style={[styles.button, styles.scanInButton]}><Icon name="log-in" size={24} color={Colors.textOnPrimary} style={styles.buttonIcon} /><Text style={styles.buttonText}>Scan In (Entry)</Text></TouchableOpacity>
            </Link>
            <Link href={{ pathname: "/scanner", params: { type: 'out' } }} asChild>
              <TouchableOpacity style={[styles.button, styles.scanOutButton]}><Icon name="log-out" size={24} color={Colors.textOnPrimary} style={styles.buttonIcon} /><Text style={styles.buttonText}>Scan Out (Exit)</Text></TouchableOpacity>
            </Link>
            <Link href="/manual-entry" asChild>
              <TouchableOpacity style={[styles.button, styles.manualButton]}><Icon name="edit" size={24} color={Colors.text} style={styles.buttonIcon} /><Text style={[styles.buttonText, { color: Colors.text }]}>Manual Entry</Text></TouchableOpacity>
            </Link>
            <Link href="/admin" asChild>
              <TouchableOpacity style={[styles.button, styles.outlineButton]}><Icon name="settings" size={24} color={Colors.textOnPrimary} style={styles.buttonIcon} /><Text style={styles.buttonText}>Admin Panel</Text></TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  backgroundImage: { flex: 1, backgroundColor: '#111827' },
  scrollViewContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  headerContainer: { alignItems: 'center', marginBottom: 32 },
  logoBackground: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 40, fontWeight: 'bold', color: Colors.textOnPrimary, marginBottom: 8, textShadowColor: 'rgba(0, 0, 0, 0.25)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 4 },
  subtitle: { fontSize: 18, color: 'rgba(255, 255, 255, 0.9)' },
  cardContainer: { width: '90%', maxWidth: 400, marginBottom: 32, gap: 16 },
  card: { backgroundColor: 'rgba(45, 55, 72, 0.8)', borderRadius: 12, padding: 24, alignItems: 'center', flex: 1 },
  cardIcon: { marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.textOnPrimary, marginBottom: 8 },
  cardText: { fontSize: 14, color: '#A0AEC0', textAlign: 'center' },
  buttonGroup: { flexDirection: 'column', gap: 16, width: '90%', maxWidth: 400 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8 },
  scanInButton: { backgroundColor: Colors.success },
  scanOutButton: { backgroundColor: Colors.danger },
  manualButton: { backgroundColor: Colors.cancel },
  outlineButton: { backgroundColor: 'rgba(45, 55, 72, 0.9)', borderWidth: 1, borderColor: Colors.border },
  buttonText: { color: Colors.textOnPrimary, fontSize: 18, fontWeight: 'bold' },
  buttonIcon: { marginRight: 12 },
   logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
});