#!/usr/bin/env python3
import os
from pathlib import Path

output_lines = []
output_lines.append("# 📚 MuntuShop Platform - Complete Documentation")
output_lines.append("")
output_lines.append("**All Documentation Combined into One Master File**")
output_lines.append("")
output_lines.append("This document contains all markdown documentation from the MuntuShop project.")
output_lines.append("")
output_lines.append("---")
output_lines.append("")
output_lines.append("# 📑 Table of Contents")
output_lines.append("")

# Define files in order
files_to_combine = [
    ("1. Project Overview", "README.md"),
    ("2. Build Summary", "BUILD-SUMMARY.md"),
    ("3. Master Index", "Md-files/MASTER-INDEX.md"),
    ("4. Quick Start Guide", "Md-files/QUICK-START-GUIDE.md"),
    ("5. Complete Platform Implementation", "Md-files/COMPLETE-PLATFORM-IMPLEMENTATION.md"),
    ("6. Green API Money Ideas", "Md-files/GREEN-API-MONEY-IDEAS.md"),
    ("7. Complete API Implementation", "Md-files/COMPLETE-API-IMPLEMENTATION.md"),
    ("8. Database, API & Deployment", "Md-files/DATABASE-API-DEPLOYMENT.md"),
    ("9. Message Flow Templates", "Md-files/MESSAGE-FLOW-TEMPLATES.md"),
    ("10. Admin & User Panels", "Md-files/ADMIN-USER-PANELS.md"),
    ("11. Cursor IDE Rules", "Md-files/CURSOR-RULES.md"),
    ("12. Quick Start", "QUICK-START.md"),
    ("13. WhatsApp Quick Start", "QUICK_START_WHATSAPP.md"),
    ("14. WhatsApp Integration Guide", "README_WHATSAPP.md"),
    ("15. Railway Deployment", "RAILWAY-DEPLOY.md"),
    ("16. Railway Setup", "RAILWAY-SETUP.md"),
    ("17. Railway PostgreSQL Solution", "RAILWAY-POSTGRES-SOLUTION.md"),
    ("18. Fix PostgreSQL", "FIX-POSTGRESQL.md"),
    ("19. PostgreSQL Fix Guide", "POSTGRESQL-FIX.md"),
    ("20. Deployment Steps", "DEPLOYMENT-STEPS.md"),
    ("21. Deployment Status", "DEPLOYMENT-STATUS.md"),
    ("22. GitHub + Railway Setup", "GITHUB-RAILWAY-SETUP.md"),
    ("23. Manual Deployment", "DEPLOY-MANUAL.md"),
    ("24. Deploy Now", "DEPLOY-NOW.md"),
    ("25. Quick Deploy", "QUICK-DEPLOY.md"),
    ("26. Railway Deploy (Original)", "Md-files/Railway deploy.md"),
    ("27. Backend README", "backend/README.md"),
]

# Build TOC
for title, _ in files_to_combine:
    anchor = title.lower().replace(' ', '-').replace('&', '').replace('(', '').replace(')', '').replace('.', '')
    output_lines.append(f"- [{title}](#{anchor})")

output_lines.append("")
output_lines.append("---")
output_lines.append("")

# Combine files
total_files = 0
for title, filepath in files_to_combine:
    if os.path.exists(filepath):
        total_files += 1
        output_lines.append(f"# {title}")
        output_lines.append("")
        output_lines.append(f"*Source: `{filepath}`*")
        output_lines.append("")
        output_lines.append("---")
        output_lines.append("")
        
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().strip()
                # Skip first title if it matches
                lines = content.split('\n')
                if lines and lines[0].startswith('#'):
                    # Check if first line is just a title
                    if len(lines) > 1 and (lines[1].strip() == '' or lines[1].startswith('**')):
                        content = '\n'.join(lines[1:]).strip()
                
                output_lines.append(content)
        except Exception as e:
            output_lines.append(f"*Error reading file {filepath}: {str(e)}*")
        
        output_lines.append("")
        output_lines.append("")
        output_lines.append("---")
        output_lines.append("")

output_lines.append("")
output_lines.append("# End of Documentation")
output_lines.append("")
output_lines.append(f"*Combined from {total_files} markdown files*")
output_lines.append(f"*Generated: {os.popen('date').read().strip()}*")

# Write file
with open('COMPLETE-DOCUMENTATION.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

print(f"✅ Created COMPLETE-DOCUMENTATION.md")
print(f"   Total lines: {len(output_lines)}")
print(f"   Files combined: {total_files}")
