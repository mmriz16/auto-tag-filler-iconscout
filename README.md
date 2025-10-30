# 🏷️ Auto Tag Filler - Iconscout Chrome Extension

A powerful Chrome extension that automatically fills and optimizes tags for Iconscout draft pages, ensuring exactly 10 tags per icon for maximum visibility and discoverability.

## 🚀 Features

- **🎯 Smart Tag Management**: Automatically ensures exactly 10 tags per icon
- **🔄 Auto-Fill from Title**: Intelligently extracts relevant tags from icon titles
- **✂️ Smart Trimming**: Removes excess tags when more than 10 are present
- **🛡️ Freeze-Proof Operation**: Robust error handling prevents script hanging
- **📊 Progress Tracking**: Real-time progress updates with detailed statistics
- **🎨 Stable DOM Handling**: Uses reliable CSS selectors for consistent performance

## 📋 How It Works

1. **Card Detection**: Automatically detects all icon cards on the draft page
2. **Tag Analysis**: Checks current tag count for each icon
3. **Smart Processing**:
   - **If < 10 tags**: Fills from title words (removes common words like "icon", "vector", etc.)
   - **If > 10 tags**: Trims excess tags to exactly 10
   - **If = 10 tags**: Leaves unchanged
4. **Progress Reporting**: Shows total processed vs. actually modified cards

## 🛠️ Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. **Download/Clone** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the extension folder
5. **Extension is ready!** The icon will appear in your extensions toolbar

### Method 2: Manual Installation

1. Download the extension files
2. Create a new folder for the extension
3. Copy all files (`manifest.json`, `content.js`, `icon128.png`) to the folder
4. Follow steps 2-5 from Method 1

## 🎮 Usage

1. **Navigate** to any Iconscout draft page: `https://contributor.iconscout.com/icon/draft/*`
2. **The extension runs automatically** - no manual activation needed
3. **Watch the progress** in the top-right corner of the page
4. **Review results** when processing completes

### Example Output:
```
🔍 Found 50 cards. Starting verification...
✅ Verified 50 icons | 23 updated
```

## 🔧 Technical Details

### Supported Pages
- **Target URL Pattern**: `https://contributor.iconscout.com/icon/draft/*`
- **Execution**: Runs automatically on page load (`document_end`)

### Key Components
- **Stable Selector**: Uses `.card_8BZOE` for reliable card detection
- **Smart Delays**: Optimized timing for DOM interactions
- **Error Recovery**: Continues processing even if individual cards fail
- **Memory Efficient**: Minimal DOM queries and cleanup

### Performance Features
- **Card Rendering Detection**: Waits up to 10 seconds for dynamic content
- **Batch Processing**: Processes all cards efficiently
- **Progress Updates**: Real-time feedback without blocking UI
- **Cleanup**: Automatic removal of progress indicators

## 📁 Project Structure

```
extention-iconscout/
├── manifest.json      # Extension configuration
├── content.js         # Main script logic
├── icon128.png        # Extension icon
├── README.md          # This documentation
└── requirements.txt   # Development notes
```

## 🔄 Version History

### v1.1 (Current)
- ✅ **Stable Selector Version**: Improved reliability with `.card_8BZOE` selector
- ✅ **Enhanced Error Handling**: Freeze-proof operation with robust error recovery
- ✅ **Smart Progress Tracking**: Shows both total processed and actually modified counts
- ✅ **Optimized Performance**: Reduced delays and improved DOM handling

### v1.0
- 🎯 Initial release with basic tag filling functionality
- 🔄 Auto-fill from title words
- ✂️ Tag trimming to 10 tags maximum

## 🐛 Troubleshooting

### Common Issues

**Extension not working?**
- Ensure you're on a valid Iconscout draft page
- Check that Developer Mode is enabled in Chrome
- Reload the extension in `chrome://extensions/`

**Script seems stuck?**
- The extension includes freeze-proof mechanisms
- Check browser console (F12) for detailed logs
- Try refreshing the page

**Tags not filling correctly?**
- Verify the page has fully loaded before the script runs
- Check that icons have titles to extract tags from

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on Iconscout draft pages
5. Submit a pull request

## 📄 License

This project is open source. Feel free to use, modify, and distribute according to your needs.

## 🙏 Acknowledgments

- Built for the Iconscout contributor community
- Designed to streamline the icon submission process
- Optimized for maximum tag visibility and discoverability

---

**Made with ❤️ for Iconscout Contributors**