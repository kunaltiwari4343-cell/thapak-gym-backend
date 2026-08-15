import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
// import { signToken, authMiddleware } from '../auth.js';

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, gymName, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email aur password zaroori hai' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password kam se kam 6 characters ka hona chahiye' });
  }

  const data = db.read();
  const existing = data.owners.find((o) => o.email === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Ye email pehle se registered hai' });
  }

  const owner = {
    id: data.nextIds.owner++,
    name,
    email: email.toLowerCase(),
    password: bcrypt.hashSync(password, 10),
    gym_name: gymName || 'Thapak Fitness',
    phone: phone || '',
    created_at: new Date().toISOString(),
  };

  data.owners.push(owner);
  db.write(data);

  const safeOwner = {
    id: owner.id,
    name: owner.name,
    email: owner.email,
    gymName: owner.gym_name,
    phone: owner.phone,
  };

  res.json({ token: signToken({ id: owner.id }), owner: safeOwner });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email aur password daalo' });
  }

  const data = db.read();
  const row = data.owners.find((o) => o.email === email.toLowerCase());
  if (!row || !bcrypt.compareSync(password, row.password)) {
    return res.status(401).json({ error: 'Galat email ya password' });
  }

  res.json({
    token: signToken({ id: row.id }),
    owner: {
      id: row.id,
      name: row.name,
      email: row.email,
      gymName: row.gym_name,
      phone: row.phone,
    },
  });
});

router.get('/me', (req, res) => {
  const data = db.read();
  const row = data.owners.find((o) => o.id === req.ownerId);
  if (!row) return res.status(404).json({ error: 'Owner not found' });

  res.json({
    id: row.id,
    name: row.name,
    email: row.email,
    gymName: row.gym_name,
    phone: row.phone,
  });
});

export default router;
