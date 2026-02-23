const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['doctor', 'patient'], required: true },
  department:      { type: String },        // doctors only
  patientId:       { type: String },        // patients only
  caretaker_name:  { type: String },        // patients only
  caretaker_phone: { type: String },        // patients only
  caretaker_email: { type: String },        // patients only
}, { timestamps: true });

// Static: find by email and verify password
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('INVALID_CREDENTIALS');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');
  return user;
};

module.exports = mongoose.model('User', userSchema);
