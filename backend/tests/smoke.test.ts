import assert from 'assert';
import { db } from '../src/database/db';
import { generateAccessToken, verifyAccessToken } from '../src/utils/jwt';
import { hashPassword, comparePassword } from '../src/utils/password';
import { AttendanceService } from '../src/services/attendance.service';

async function runSmokeTests() {
  console.log('🧪 Starting CNHS Backend Smoke & Regression Tests...\n');

  // Test 1: Password hashing and verification
  console.log('1️⃣ Testing Password Hashing & Verification...');
  const plain = 'CNHS_TestPassword123!';
  const hashed = await hashPassword(plain);
  assert.notStrictEqual(plain, hashed, 'Password should be hashed');
  const isValid = await comparePassword(plain, hashed);
  assert.strictEqual(isValid, true, 'Valid password comparison failed');
  const isInvalid = await comparePassword('wrong-password', hashed);
  assert.strictEqual(isInvalid, false, 'Invalid password comparison should fail');
  console.log('   ✅ Password hash & verification passed.\n');

  // Test 2: JWT Access Token generation & verification
  console.log('2️⃣ Testing JWT Token Signing & Verification...');
  const payload = {
    userId: 'test-user-id',
    email: 'admin@cnhs.edu.ph',
    role: 'ADMINISTRATOR' as const,
  };
  const token = generateAccessToken(payload);
  assert(token && token.length > 20, 'Token generation failed');
  const decoded = verifyAccessToken(token);
  assert.strictEqual(decoded.userId, payload.userId, 'Token userId mismatch');
  assert.strictEqual(decoded.email, payload.email, 'Token email mismatch');
  assert.strictEqual(decoded.role, payload.role, 'Token role mismatch');
  console.log('   ✅ JWT token generation & payload verification passed.\n');

  // Test 3: Database Query & Integrity Check
  console.log('3️⃣ Testing Database Query & Data Integrity...');
  const users = await db.query('SELECT id, email, role FROM users LIMIT 5');
  assert(Array.isArray(users), 'DB query should return an array');
  assert(users.length > 0, 'Database should contain seeded users');
  console.log(`   Found ${users.length} seeded users in active database.`);

  const activities = await db.query('SELECT id, title, category_id FROM activities LIMIT 5');
  assert(activities.length > 0, 'Database should contain seeded activities');
  console.log(`   Found ${activities.length} seeded activities.`);
  console.log('   ✅ Database connectivity & seeded data verified.\n');

  // Test 4: Attendance Service Stats calculation
  console.log('4️⃣ Testing Attendance Service Stats Calculation...');
  // Query a seeded student
  const student = await db.get('SELECT id FROM students LIMIT 1');
  if (student) {
    const stats = await AttendanceService.getStudentAttendanceStats(student.id);
    assert(typeof stats.attendanceRate === 'number', 'Attendance rate must be a number');
    assert(stats.attendanceRate >= 0 && stats.attendanceRate <= 100, 'Attendance rate must be between 0 and 100');
    assert(typeof stats.streakCount === 'number', 'Streak count must be a number');
    console.log(`   Student ${student.id} stats: Rate=${stats.attendanceRate}%, Streak=${stats.streakCount} sessions.`);
  }
  console.log('   ✅ Attendance service calculations passed.\n');

  console.log('🎉 ALL CNHS SYSTEM SMOKE TESTS PASSED SUCCESSFULLY! 🚀');
  process.exit(0);
}

runSmokeTests().catch((err) => {
  console.error('❌ Smoke tests failed:', err);
  process.exit(1);
});
