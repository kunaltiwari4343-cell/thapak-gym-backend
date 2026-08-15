import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gymfit-pro-secret-key-2026';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

const router = express.Router();

// Register Route
router.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, gymName, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email aur password zaroori hai' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password kam se kam 6 characters ka hona chahiye' });
    }

    const data = db.read();
    if (!data.owners) data.owners = [];

    const existing = data.owners.find((o) => o.email === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Ye email pehle se registered hai' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newOwner = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      gymName: gymName || 'My Gym',
      phone: phone || ''
    };

    data.owners.push(newOwner);
    db.write(data);

    const token = signToken({ id: newOwner.id, email: newOwner.email });
    res.status(201).json({ message: 'Account ban gaya!', token, owner: { id: newOwner.id, name: newOwner.name, email: newOwner.email, gymName: newOwner.gymName } });
  } catch (err) {
    res.status(500).json({ error: 'Server error aa gaya' });
  }
});

// Login Route
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email aur password bharna zaroori hai' });
    }

    const data = db.read();
    if (!data.owners) data.owners = [];

    const owner = data.owners.find((o) => o.email === email.toLowerCase());
    if (!owner) {
      return res.status(400).json({ error: 'Email ya password galat hai' });
    }

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Email ya password galat hai' });
    }

    const token = signToken({ id: owner.id, email: owner.email });
    res.json({ message: 'Login ho gaya!', token, owner: { id: owner.id, name: owner.name, email: owner.email, gymName: owner.gymName } });
  } catch (err) {
    res.status(500).json({ error: 'Server error aa gaya' });
  }
});

export default router;
