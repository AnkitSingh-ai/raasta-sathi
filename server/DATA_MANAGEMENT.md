# 📊 Data Management Guide - Raasta Sathi

## 🎯 Overview
This guide explains how to manage real user data in your Raasta Sathi project. **NEVER store real user data in source code files.**

## 🚨 Security Warning
- **Real user data** should NEVER be hardcoded in source code
- **Passwords** should always be hashed using bcrypt
- **Personal information** should be protected and encrypted
- **Source code** should not contain sensitive data

## 📁 Available Scripts

### 1. **Seed Data (Development Only)**
```bash
npm run seed
```
- **Purpose**: Create sample/demo data for development
- **Use Case**: Testing, development, demo purposes
- **Data**: Sample users, reports, service requests
- **⚠️ Warning**: DELETES all existing data before seeding

### 2. **Export Real Data (Backup)**
```bash
npm run export
```
- **Purpose**: Backup real user data from MongoDB
- **Use Case**: Data backup, migration, analysis
- **Data**: All real users, reports, service requests, notifications
- **Location**: `server/exports/` directory
- **Format**: JSON files with timestamps

### 3. **Import Real Data (Restore)**
```bash
npm run import
```
- **Purpose**: Restore real user data to MongoDB
- **Use Case**: Data restoration, migration between environments
- **Data**: Imports from exported JSON files
- **Safety**: Checks for existing data to avoid duplicates

## 🔄 Data Flow

```
Real Users → MongoDB → Export Script → JSON Files → Import Script → MongoDB
     ↓              ↓           ↓           ↓           ↓
  Frontend    Database    Backup    Storage    Restore
```

## 📋 What Gets Exported

### Users
- ✅ Name, email, role, contact info
- ✅ Points, badges, levels
- ✅ Department, jurisdiction (for authorities)
- ❌ Passwords (hashed or plain)
- ❌ OTP codes
- ❌ Reset tokens

### Reports
- ✅ Type, title, description
- ✅ Location (address, coordinates)
- ✅ Severity, status
- ✅ Photos, comments, replies
- ✅ Timestamps, user references

### Service Requests
- ✅ Type, description, urgency
- ✅ Location, citizen details
- ✅ Status, timestamps

### Notifications
- ✅ Type, message, recipients
- ✅ Timestamps, read status

## 🛡️ Security Features

1. **Password Protection**: Exported user data excludes passwords
2. **Duplicate Prevention**: Import checks for existing records
3. **Data Validation**: Imports validate data structure
4. **Safe Storage**: Exports stored in `server/exports/` (gitignored)

## 📂 File Structure

```
server/
├── utils/
│   ├── seedData.js          # Sample data (development)
│   ├── exportRealData.js    # Export real data
│   ├── importRealData.js    # Import real data
│   └── ...
├── exports/                  # Exported data (auto-created)
│   ├── users-2024-01-27T10-30-00-000Z.json
│   ├── reports-2024-01-27T10-30-00-000Z.json
│   └── export-summary-2024-01-27T10-30-00-000Z.json
└── ...
```

## 🚀 Usage Examples

### Backup Current Data
```bash
cd server
npm run export
```

### Restore Data to New Environment
```bash
cd server
npm run import
```

### Import from Specific Directory
```bash
cd server
node utils/importRealData.js /path/to/exported/data
```

## ⚠️ Important Notes

1. **Never commit exported data** to version control
2. **Always backup** before running seed scripts
3. **Test imports** in development environment first
4. **Monitor disk space** for large exports
5. **Secure exported files** - they contain user information

## 🔧 Troubleshooting

### Export Fails
- Check MongoDB connection
- Verify database permissions
- Ensure sufficient disk space

### Import Fails
- Check file permissions
- Verify JSON file integrity
- Check MongoDB connection
- Ensure models are compatible

### Seed Data Issues
- Check bcrypt import
- Verify model schemas
- Check for duplicate emails

## 📞 Support

If you encounter issues:
1. Check server logs
2. Verify MongoDB connection
3. Check file permissions
4. Review error messages

## 🎯 Best Practices

1. **Regular Backups**: Export data weekly/monthly
2. **Test Imports**: Always test in development first
3. **Secure Storage**: Keep exported files secure
4. **Document Changes**: Note any data structure changes
5. **Version Control**: Never commit real user data

---

**Remember**: Real user data is valuable and sensitive. Always handle it with care and respect user privacy! 🔒







































