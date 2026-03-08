const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass || user === 'your-email@gmail.com') {
      console.warn('Warning: SMTP not configured. Emails will be logged to console instead.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: user,
        pass: pass
      }
    });
  }
  return transporter;
}

async function sendEmail(to, subject, html) {
  const transport = getTransporter();
  const from = process.env.EMAIL_FROM || 'info@impulsedrive.co.uk';

  if (!transport) {
    console.log('--- Email (not sent, SMTP not configured) ---');
    console.log(`To: ${to}`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.substring(0, 200)}...`);
    console.log('--- End Email ---');
    return { messageId: 'local-dev-' + Date.now() };
  }

  const info = await transport.sendMail({
    from: `"Impulse Driving School" <${from}>`,
    to,
    subject,
    html
  });

  console.log(`Email sent: ${info.messageId}`);
  return info;
}

async function sendBookingConfirmation(booking) {
  const subject = `Booking Confirmation - ${booking.reference}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
        .details td:first-child { font-weight: bold; color: #555; width: 140px; }
        .reference { font-size: 20px; font-weight: bold; color: #FF6B35; text-align: center; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        .cta { display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Impulse Driving School</h1>
          <p>Booking Confirmation</p>
        </div>
        <div class="content">
          <p>Dear ${booking.name},</p>
          <p>Thank you for booking with Impulse Driving School! Your booking has been confirmed.</p>

          <div class="reference">Reference: ${booking.reference}</div>

          <div class="details">
            <table>
              <tr><td>Course</td><td>${booking.course}</td></tr>
              <tr><td>Transmission</td><td>${booking.transmission}</td></tr>
              <tr><td>Date</td><td>${booking.date}</td></tr>
              <tr><td>Time Slot</td><td>${booking.time_slot}</td></tr>
              <tr><td>Status</td><td>${booking.status}</td></tr>
            </table>
          </div>

          ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}

          <p>Please keep your reference number safe. You can use it to check your booking status.</p>

          <p>If you have any questions, please don't hesitate to contact us:</p>
          <ul>
            <li>Phone: 07368 543 368</li>
            <li>Email: info@impulsedrive.co.uk</li>
          </ul>
        </div>
        <div class="footer">
          <p>Impulse Driving School | Spaces, Oxford St, Manchester, M1 5AN</p>
          <p>&copy; ${new Date().getFullYear()} Impulse Driving School. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(booking.email, subject, html);
}

async function sendContactNotification(contact) {
  const businessEmail = process.env.EMAIL_FROM || 'info@impulsedrive.co.uk';
  const subject = `New Contact Form Submission: ${contact.subject}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2C3E50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 8px 0; border-bottom: 1px solid #eee; }
        .details td:first-child { font-weight: bold; color: #555; width: 100px; }
        .message-box { background: white; padding: 15px; border-left: 4px solid #FF6B35; margin: 15px 0; border-radius: 0 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
          <div class="details">
            <table>
              <tr><td>Name</td><td>${contact.name}</td></tr>
              <tr><td>Email</td><td>${contact.email}</td></tr>
              <tr><td>Phone</td><td>${contact.phone || 'Not provided'}</td></tr>
              <tr><td>Subject</td><td>${contact.subject}</td></tr>
            </table>
          </div>

          <h3>Message:</h3>
          <div class="message-box">
            <p>${contact.message}</p>
          </div>

          <p><small>Received at: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</small></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(businessEmail, subject, html);
}

async function sendNewsletterWelcome(email) {
  const subject = 'Welcome to Impulse Driving School Newsletter!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Impulse Driving School</h1>
          <p>Welcome to Our Newsletter!</p>
        </div>
        <div class="content">
          <p>Hello!</p>
          <p>Thank you for subscribing to the Impulse Driving School newsletter. You'll now receive:</p>
          <ul>
            <li>Driving tips and road safety advice</li>
            <li>Special offers and promotions</li>
            <li>Updates on new courses and services</li>
            <li>Test centre news and changes</li>
          </ul>
          <p>We're Manchester's premier driving academy with a 93% pass rate and over 5,000 happy students.</p>
          <p>If you have any questions, feel free to reach out to us at info@impulsedrive.co.uk or call 07368 543 368.</p>
          <p>Happy driving!</p>
          <p><strong>The Impulse Driving School Team</strong></p>
        </div>
        <div class="footer">
          <p>Impulse Driving School | Spaces, Oxford St, Manchester, M1 5AN</p>
          <p>&copy; ${new Date().getFullYear()} Impulse Driving School. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendContactNotification,
  sendNewsletterWelcome
};
