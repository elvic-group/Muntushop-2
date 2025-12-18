/**
 * WhatsApp Integration Test Script
 * Tests the WhatsApp service connection and basic functionality
 */

require("dotenv").config();
const { sendMessage, getAccountSettings, checkWhatsApp } = require("./whatsapp_service");

async function testWhatsAppIntegration() {
    console.log("🧪 Testing WhatsApp Integration...\n");

    // Test 1: Check account settings
    console.log("1️⃣ Testing account settings...");
    try {
        const settings = await getAccountSettings();
        if (settings.success) {
            console.log("✅ Account settings retrieved successfully");
            console.log("   Instance:", settings.data?.stateInstance || "Connected");
        } else {
            console.log("❌ Failed to get account settings:", settings.error);
        }
    } catch (error) {
        console.log("❌ Error:", error.message);
    }

    console.log("\n2️⃣ Testing WhatsApp check (example number)...");
    // Test 2: Check if a number has WhatsApp (using example number)
    try {
        const check = await checkWhatsApp("79999999999");
        if (check.success) {
            console.log("✅ WhatsApp check completed");
            console.log("   Result:", check.data?.existsWhatsapp ? "Has WhatsApp" : "No WhatsApp");
        } else {
            console.log("⚠️  Check failed (this is normal if number doesn't exist):", check.error);
        }
    } catch (error) {
        console.log("⚠️  Check error (this is normal):", error.message);
    }

    console.log("\n3️⃣ Configuration check...");
    const idInstance = process.env.GREEN_ID_INSTANCE;
    const apiToken = process.env.GREEN_API_TOKEN_INSTANCE;

    if (idInstance && apiToken) {
        console.log("✅ Environment variables configured");
        console.log("   Instance ID:", idInstance);
        console.log("   API Token:", apiToken.substring(0, 10) + "...");
    } else {
        console.log("❌ Missing environment variables!");
        console.log("   Please set GREEN_ID_INSTANCE and GREEN_API_TOKEN_INSTANCE in .env");
    }

    console.log("\n📝 Note: To test sending a message, uncomment the code below");
    console.log("   and replace '79999999999@c.us' with a valid WhatsApp number.\n");

    // Uncomment below to test sending a message
    // console.log("\n4️⃣ Testing message send...");
    // try {
    //     const result = await sendMessage("79999999999@c.us", "🧪 Test message from MuntuShop!");
    //     if (result.success) {
    //         console.log("✅ Message sent successfully!");
    //         console.log("   Message ID:", result.data?.idMessage);
    //     } else {
    //         console.log("❌ Failed to send message:", result.error);
    //     }
    // } catch (error) {
    //     console.log("❌ Error sending message:", error.message);
    // }

    console.log("\n✨ Test completed!");
}

// Run tests
testWhatsAppIntegration().catch(console.error);

