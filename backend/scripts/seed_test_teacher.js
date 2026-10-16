const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connStr = process.env.DATABASE_URL;

async function seedTestTeacher() {
  console.log('Seeding test teacher account: qpgtest@gmail.com / 123456 (Chemistry)...');
  
  const userId = 'usr_qpgtest_chem';
  const email = 'qpgtest@gmail.com';
  const password = '123456';
  const name = 'Prof. Chemistry Faculty';
  const subject = 'Chemistry';
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  if (connStr) {
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // 1. Ensure password column
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);');

    // 2. Upsert user
    const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    let targetUserId = userId;
    if (checkUser.rows.length > 0) {
      targetUserId = checkUser.rows[0].id;
      await client.query(
        'UPDATE users SET password = $1, subject = $2, name = $3 WHERE id = $4',
        [password, subject, name, targetUserId]
      );
      console.log(`✓ Updated existing user ${targetUserId} with password and Chemistry subject`);
    } else {
      await client.query(
        'INSERT INTO users (id, email, password, name, institution, subject, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [targetUserId, email, password, name, 'QPG Science Academy', subject, 'teacher', now.toISOString()]
      );
      console.log(`✓ Inserted new user ${targetUserId}`);
    }

    // 3. Upsert active subscription
    const subId = 'sub_qpgtest_chem';
    const checkSub = await client.query('SELECT id FROM subscriptions WHERE user_id = $1', [targetUserId]);
    if (checkSub.rows.length > 0) {
      await client.query(
        `UPDATE subscriptions SET
           status = 'active',
           plan_name = 'Premium Monthly',
           amount = 299.00,
           started_at = $1,
           expires_at = $2,
           payment_reference = 'UTR_TEST_CHEMISTRY_299',
           updated_at = $1
         WHERE user_id = $3`,
        [now.toISOString(), nextMonth.toISOString(), targetUserId]
      );
      console.log(`✓ Updated subscription for ${targetUserId} (Active until ${nextMonth.toISOString()})`);
    } else {
      await client.query(
        `INSERT INTO subscriptions (id, user_id, plan_name, amount, status, started_at, expires_at, payment_reference, created_at, updated_at)
         VALUES ($1, $2, 'Premium Monthly', 299.00, 'active', $3, $4, 'UTR_TEST_CHEMISTRY_299', $3, $3)`,
        [subId, targetUserId, now.toISOString(), nextMonth.toISOString()]
      );
      console.log(`✓ Created new 1-month active subscription for ${targetUserId}`);
    }

    await client.end();
  }

  // Also write into local JSON file backend/data/db.json if it exists
  const localDbPath = path.join(__dirname, '../data/db.json');
  if (fs.existsSync(localDbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
      if (!data.users) data.users = [];
      if (!data.subscriptions) data.subscriptions = [];

      const uIdx = data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      const userObj = {
        id: uIdx >= 0 ? data.users[uIdx].id : userId,
        email,
        password,
        name,
        institution: 'QPG Science Academy',
        subject,
        role: 'teacher',
        created_at: now.toISOString(),
      };
      if (uIdx >= 0) {
        data.users[uIdx] = userObj;
      } else {
        data.users.push(userObj);
      }

      const sIdx = data.subscriptions.findIndex(s => s.user_id === userObj.id);
      const subObj = {
        id: 'sub_qpgtest_chem',
        user_id: userObj.id,
        plan_name: 'Premium Monthly',
        amount: 299.00,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: nextMonth.toISOString(),
        payment_reference: 'UTR_TEST_CHEMISTRY_299',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      if (sIdx >= 0) {
        data.subscriptions[sIdx] = subObj;
      } else {
        data.subscriptions.push(subObj);
      }

      fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('✓ Synced with local backend/data/db.json');
    } catch (e) {
      console.warn('Could not sync local JSON:', e.message);
    }
  }

  console.log('\n🎉 TEST TEACHER CREATED SUCCESSFULLY!');
  console.log('----------------------------------------------------');
  console.log(`Email:        ${email}`);
  console.log(`Password:     ${password}`);
  console.log(`Subject:      Chemistry (Locked)`);
  console.log(`Subscription: ACTIVE (1 Month, expires ${nextMonth.toDateString()})`);
  console.log('----------------------------------------------------\n');
}

seedTestTeacher().catch(e => {
  console.error('Error seeding test teacher:', e);
  process.exit(1);
});
