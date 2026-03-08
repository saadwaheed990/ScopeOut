const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateReference() {
  let result = 'IMP-';
  for (let i = 0; i < 5; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

function generateUniqueReference(db) {
  const stmt = db.prepare('SELECT id FROM bookings WHERE reference = ?');
  let reference;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    reference = generateReference();
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique booking reference');
    }
  } while (stmt.get(reference));

  return reference;
}

module.exports = { generateReference, generateUniqueReference };
