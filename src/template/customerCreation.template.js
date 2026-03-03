const customerAccountCreation = (userName, password, resetLink) => `
<div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px">
    <div style="max-width:600px; background:white; margin:auto; padding:20px; border-radius:8px">

        <h2 style="color:#2c3e50">👋 Welcome to Let's Drive!</h2>

        <p>Hi <b>${userName}</b>,</p>
        <p>An administrator has created a new Customer account for you on Let's Drive.</p>

        <hr/>

        <h3>Your Account Details</h3>
        <p><b>Username:</b> ${userName}</p>

        <p>For security reasons, we highly recommend changing your temporary password immediately. Click the button below to set a new password. <b>Please note that this link will expire in 2 hours.</b></p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Change Password</a>
        </div>

        <p style="font-size: 14px; color: #555;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #3498db; word-break: break-all;">${resetLink}</p>

        <hr/>
        <p style="font-size:12px;color:#777">
        Thank you for choosing Let's Drive. <br/>
        Need help? support@letsdrive.com
        </p>

    </div>
    </div>
`;

module.exports = { customerAccountCreation };