import bcrypt from 'bcrypt';
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  try {
    const connection = await createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const email = 'admin@example.com';
    const password = '123456';
    const displayName = 'Administrator';
    const role = 'admin';

    const hashedPassword = await bcrypt.hash(password, 10);

    // ตรวจสอบว่า email นี้มีใน DB แล้วหรือยัง
    const [rows]: any = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      console.log('Admin account already exists!');
      process.exit(0);
    }

    await connection.execute(
      'INSERT INTO users (email, password, display_name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, displayName, role]
    );

    console.log('✅ Admin account created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);

    await connection.end();
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
