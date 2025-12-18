#!/usr/bin/env python3
"""
MuntuShop WhatsApp Bot
A complete WhatsApp chatbot for the MuntuShop multi-service platform
"""

import os
from whatsapp_chatbot_python import GreenAPIBot, Notification

# Load environment variables
ID_INSTANCE = os.getenv("GREEN_ID_INSTANCE", "7700330457")
API_TOKEN_INSTANCE = os.getenv("GREEN_API_TOKEN_INSTANCE", "075b6e1771bb4fd5996043ab9f36bf34ac6d81ebb87549b6aa")

# Initialize the bot
bot = GreenAPIBot(ID_INSTANCE, API_TOKEN_INSTANCE)


@bot.router.message(command="start")
def start_handler(notification: Notification) -> None:
    """Welcome message with main menu"""
    sender_data = notification.event["senderData"]
    sender_name = sender_data.get("senderName", "Customer")
    
    menu = (
        f"👋 Welcome to *MuntuShop*, {sender_name}!\n\n"
        "🛍️ *Our Services:*\n\n"
        "1️⃣  Shopping (Dropshipping Store)\n"
        "2️⃣  Bulk Messaging Service\n"
        "3️⃣  Customer Support Assistant\n"
        "4️⃣  Appointment Booking\n"
        "5️⃣  Group Management\n"
        "6️⃣  Money Transfer Assistant\n"
        "7️⃣  Online Courses\n"
        "8️⃣  Local News & Updates\n"
        "9️⃣  Marketing Services\n"
        "🔟  B2B Wholesale Orders\n"
        "1️⃣1️⃣ IPTV Subscriptions\n\n"
        "📝 *Commands:*\n"
        "• Type a number (1-11) to access a service\n"
        "• Type 'menu' to see this menu again\n"
        "• Type 'help' for support\n\n"
        "💬 How can we help you today?"
    )
    
    notification.answer(menu)


@bot.router.message(text_message=["1", "Shopping", "shop", "store"])
def shopping_handler(notification: Notification) -> None:
    """Shopping service menu"""
    menu = (
        "🛍️ *Shopping Service*\n\n"
        "Browse our catalog and order products!\n\n"
        "📋 *Options:*\n"
        "• Type 'browse' to see products\n"
        "• Type 'cart' to view your cart\n"
        "• Type 'orders' to see your orders\n"
        "• Type 'menu' to go back\n"
    )
    notification.answer(menu)


@bot.router.message(text_message=["11", "IPTV", "iptv"])
def iptv_handler(notification: Notification) -> None:
    """IPTV subscription service"""
    menu = (
        "📺 *IPTV Subscription Service*\n\n"
        "Choose your package:\n\n"
        "1️⃣  Basic - $5/month\n"
        "2️⃣  Premium - $10/month\n"
        "3️⃣  Ultra - $15/month\n\n"
        "Type the package number to subscribe!\n"
        "Type 'menu' to go back"
    )
    notification.answer(menu)


@bot.router.message(text_message=["menu", "Menu", "MENU"])
def menu_handler(notification: Notification) -> None:
    """Return to main menu"""
    start_handler(notification)


@bot.router.message(text_message=["help", "Help", "HELP", "support"])
def help_handler(notification: Notification) -> None:
    """Help and support"""
    help_text = (
        "🆘 *MuntuShop Support*\n\n"
        "Need help? Here's what you can do:\n\n"
        "📞 Contact Support:\n"
        "• Email: support@muntushop.com\n"
        "• WhatsApp: +1234567890\n\n"
        "💡 *Common Commands:*\n"
        "• 'start' - Main menu\n"
        "• 'menu' - Show menu\n"
        "• 'help' - This message\n\n"
        "Type 'menu' to return to main menu"
    )
    notification.answer(help_text)


@bot.router.message()
def default_handler(notification: Notification) -> None:
    """Default handler for unrecognized messages"""
    message = notification.message_text.lower()
    
    if any(word in message for word in ["hi", "hello", "hey"]):
        notification.answer("👋 Hello! Type 'start' to see our services!")
    elif any(word in message for word in ["thanks", "thank you", "thx"]):
        notification.answer("🙏 You're welcome! How else can we help? Type 'menu' for options.")
    else:
        notification.answer(
            "🤔 I didn't understand that. Type 'start' to see our services or 'help' for support."
        )


if __name__ == "__main__":
    print("🚀 Starting MuntuShop WhatsApp Bot...")
    print(f"📱 Instance ID: {ID_INSTANCE}")
    print("✅ Bot is running. Press Ctrl+C to stop.")
    
    try:
        bot.run_forever()
    except KeyboardInterrupt:
        print("\n👋 Bot stopped. Goodbye!")

