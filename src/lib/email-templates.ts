export const getEvaluatorInvitationEmail = (evaluatorLink: string) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evaluator Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                🏆 Dormitory Evaluation System
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #ecfdf5; font-size: 14px;">
                                Evaluator Invitation
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                You've Been Selected as an Evaluator! 🎉
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Congratulations! You have been selected to participate as an evaluator in the dormitory evaluation process. Your input is valuable in helping us maintain and improve our dormitory standards.
                            </p>
                            
                            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                                    <strong>What's Next?</strong><br>
                                    Click the button below to access your evaluator dashboard and begin the evaluation process. You'll be able to review and rate your fellow dormers based on established criteria.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${evaluatorLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.4);">
                                            Access Evaluator Dashboard →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 10px 0 0 0;">
                                <a href="${evaluatorLink}" style="color: #10b981; text-decoration: none; word-break: break-all; font-size: 14px;">
                                    ${evaluatorLink}
                                </a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Thank you for your participation!
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} Dormitory Evaluation System. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

export const getResultsEmail = (dormerName: string, criteriaResults: { name: string, score: number, weight: number, description: string }[], totalScore: number, rank: number) => {
    const criteriaRows = criteriaResults.map(result => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0;">
                <p style="margin: 0; color: #1f2937; font-weight: 600;">${result.name}</p>
                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">${result.description}</p>
            </td>
            <td style="padding: 12px 0; text-align: center; color: #4b5563;">
                <span style="background-color: #e5e7eb; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                    ${result.weight}%
                </span>
            </td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1f2937;">
                ${result.score.toFixed(2)}
            </td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evaluation Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                📊 Evaluation Results
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Hello, ${dormerName}
                            </h2>
                            <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px;">
                                Your evaluation results have been finalized. Here is a breakdown of your performance based on the specific criteria.
                            </p>
                            
                            <!-- Total Score Card -->
                            <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                                <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; text-align: center;">
                                    <p style="margin: 0; color: #166534; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                                        Final Score
                                    </p>
                                    <p style="margin: 10px 0 0 0; color: #15803d; font-size: 36px; font-weight: 800;">
                                        ${totalScore.toFixed(2)}
                                    </p>
                                </div>
                                <div style="flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; text-align: center;">
                                    <p style="margin: 0; color: #166534; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                                        Rank
                                    </p>
                                    <p style="margin: 10px 0 0 0; color: #15803d; font-size: 36px; font-weight: 800;">
                                        #${rank}
                                    </p>
                                </div>
                            </div>

                            <!-- Criteria Breakdown -->
                            <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 18px; font-weight: 600; border-left: 4px solid #10b981; padding-left: 10px;">
                                Detailed Breakdown
                            </h3>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding-bottom: 10px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Criteria</th>
                                        <th style="padding-bottom: 10px; text-align: center; color: #6b7280; font-size: 12px; text-transform: uppercase;">Weight</th>
                                        <th style="text-align: right; padding-bottom: 10px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${criteriaRows}
                                </tbody>
                            </table>

                            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                                <p style="margin: 0;">
                                    <strong>Note:</strong> These results are aggregated from objective metrics and peer evaluations. If you have any questions regarding your score, please contact the administration.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Dormitory Evaluation System
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

