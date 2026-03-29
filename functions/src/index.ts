import * as admin from "firebase-admin";
import nodemailer from "nodemailer";
import {defineString} from "firebase-functions/params";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";

admin.initializeApp();

// 🔐 get smtp creds via params API (functions.config() deprecated)
const smtpEmail = defineString("SMTP_EMAIL");
const smtpPass = defineString("SMTP_PASS");

// 📩 transporter
const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 587,
  secure: false,
  auth: {
    user: smtpEmail.value(),
    pass: smtpPass.value(),
  },
});

// 🔥 Trigger when booking is created: send pending confirmation email
export const sendBookingEmail = onDocumentCreated(
  {
    document: "bookings/{bookingId}",
    database: "default",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    if (!data) return;

    const email = data?.user?.email;
    const name = data?.user?.name || "Customer";
    const time = data?.time || "";
    const serviceTotal = Number(data?.totalPrice) || 0;
    const bookingFee = Number(data?.bookingFee) || 0;
    const grandTotal = serviceTotal + bookingFee;
    const date = data?.date || "";

    if (!email) {
      console.log("No email found");
      return;
    }

    const mailOptions = {
      from: "CutQ <connect@cutq.store>",
      to: email,
      subject: "Booking request received ✂️",
      html: `
        <div style="font-family:Arial">
          <h2>Booking request received</h2>
          <p>Hi ${name},</p>
          <p>
            Your booking request has been created and is
            <strong> pending salon confirmation</strong>.
          </p>
          <b>Date:</b> ${date}<br/>
          <b>Time:</b> ${time}<br/>
          <b>Service Total:</b> ₹${serviceTotal}<br/>
          <b>Booking Fee:</b> ₹${bookingFee}<br/>
          <b>Total:</b> ₹${grandTotal}<br/><br/>
          <p>
            You will receive another email once the salon confirms your
            booking.
          </p>
          <p>Thanks for using CutQ 💈</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ Pending booking email sent to", email);
    } catch (err) {
      console.error("❌ Pending booking email failed", err);
    }
  },
);

// 🔥 Trigger when booking status changes from pending → confirmed
// Send final confirmation email
export const sendBookingStatusEmail = onDocumentUpdated(
  {
    document: "bookings/{bookingId}",
    database: "default",
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!beforeData || !afterData) return;

    const previousStatus = beforeData.status;
    const newStatus = afterData.status;

    // ── Cancelled: notify customer (salon or self-cancel) ─────────────────
    if (newStatus === "CANCELLED" && previousStatus !== "CANCELLED") {
      const email = afterData?.user?.email;
      const name = afterData?.user?.name || "Customer";
      const time = afterData?.time || "";
      const date = afterData?.date || "";
      const salonName = afterData?.salon?.name || "the salon";
      const cancelledBy = afterData?.cancelledBy as string | undefined;

      if (!email) {
        console.log("No email found for cancelled booking");
        return;
      }

      let subject: string;
      let bodyIntro: string;
      if (cancelledBy === "SALON") {
        subject = "Your booking was cancelled by the salon ✂️";
        bodyIntro =
          `<p><strong>${salonName}</strong> has cancelled this booking request. ` +
          `You will not be charged for this appointment.</p>`;
      } else if (cancelledBy === "USER") {
        subject = "Your booking cancellation ✂️";
        bodyIntro =
          "<p>You have successfully cancelled this booking.</p>";
      } else {
        subject = "Your booking has been cancelled ✂️";
        bodyIntro =
          "<p>Your booking has been <strong>cancelled</strong>.</p>";
      }

      const mailOptions = {
        from: "CutQ <connect@cutq.store>",
        to: email,
        subject,
        html: `
        <div style="font-family:Arial">
          <h2>Booking cancelled</h2>
          <p>Hi ${name},</p>
          ${bodyIntro}
          <b>Salon:</b> ${salonName}<br/>
          <b>Date:</b> ${date}<br/>
          <b>Time:</b> ${time}<br/><br/>
          <p>View your appointments anytime in the CutQ app.</p>
          <p>Thanks for using CutQ 💈</p>
        </div>
      `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log("✅ Cancellation email sent to", email);
      } catch (err) {
        console.error("❌ Cancellation email failed", err);
      }
      return;
    }

    // ── Confirmed by salon ─────────────────────────────────────────────────
    if (previousStatus !== "PENDING" || newStatus !== "CONFIRMED") {
      return;
    }

    const email = afterData?.user?.email;
    const name = afterData?.user?.name || "Customer";
    const time = afterData?.time || "";
    const serviceTotal = Number(afterData?.totalPrice) || 0;
    const bookingFee = Number(afterData?.bookingFee) || 0;
    const grandTotal = serviceTotal + bookingFee;
    const date = afterData?.date || "";

    if (!email) {
      console.log("No email found for confirmed booking");
      return;
    }

    const mailOptions = {
      from: "CutQ <connect@cutq.store>",
      to: email,
      subject: "Your booking is confirmed ✂️",
      html: `
        <div style="font-family:Arial">
          <h2>Your booking is confirmed</h2>
          <p>Hi ${name},</p>
          <p>Your booking has been <strong>confirmed by the salon</strong>.</p>
          <b>Date:</b> ${date}<br/>
          <b>Time:</b> ${time}<br/>
          <b>Service Total:</b> ₹${serviceTotal}<br/>
          <b>Booking Fee:</b> ₹${bookingFee}<br/>
          <b>Total:</b> ₹${grandTotal}<br/><br/>
          <p>We look forward to seeing you. Thanks for using CutQ 💈</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ Confirmation email sent to", email);
    } catch (err) {
      console.error("❌ Confirmation email failed", err);
    }
  },
);
