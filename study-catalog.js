// Shared inventory of every study tool. Add new modules here.
window.STUDY_CATALOG = [
  {
    "id": "exam-simulator",
    "bn": "BCS প্রস্তুতি প্ল্যাটফর্ম — ৪৪-৫০তম",
    "en": "Full Exam Simulator",
    "path": "bcs/question-bank/BCS_44_50_Exam_Simulator.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "indexeddb",
      "dbName": "bcs_prep_db",
      "version": 1,
      "stores": [
        "attempts",
        "bookmarks",
        "examProgress",
        "qhistory",
        "settings"
      ]
    }
  },
  {
    "id": "bangla-uttaran-system",
    "bn": "বাংলা ভাষা",
    "en": "Study & Revision System",
    "path": "bcs/question-bank/Bangla_Uttaran_Interactive_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "keys",
      "keys": [
        "bu_qstate_v1",
        "bu_topicstate_v1",
        "bu_meta_v1"
      ]
    }
  },
  {
    "id": "bangla-uttaran-app",
    "bn": "বাংলা সাহিত্য",
    "en": "Literature Practice App",
    "path": "bcs/question-bank/bangla_uttaran_study_app.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "keys",
      "keys": [
        "buApp_v2"
      ]
    }
  },
  {
    "id": "english-language",
    "bn": "English Language",
    "en": "Study & Revision System",
    "path": "bcs/question-bank/English_Language_Interactive_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "prefix",
      "prefix": "elsr_"
    }
  },
  {
    "id": "english-literature",
    "bn": "English Literature",
    "en": "Study & Revision System",
    "path": "bcs/question-bank/English_Literature_Interactive_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "keys",
      "keys": [
        "els_progress_v1"
      ]
    }
  },
  {
    "id": "bangladesh-affairs",
    "bn": "বাংলাদেশ বিষয়াবলি",
    "en": "Study & Revision System",
    "path": "bcs/question-bank/Bangladesh_Interactive_Study_Revision_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "keys",
      "keys": [
        "bdStudySystem_v1"
      ]
    }
  },
  {
    "id": "international-affairs",
    "bn": "আন্তর্জাতিক বিষয়াবলি",
    "en": "Study System",
    "path": "bcs/question-bank/International_Affairs_Interactive_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "keys",
      "keys": [
        "iaq_state_v1"
      ]
    }
  },
  {
    "id": "geography",
    "bn": "ভূগোল",
    "en": "Study & Revision System",
    "path": "bcs/question-bank/Geography_Interactive_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "keys",
      "keys": [
        "geoStudy_v1"
      ]
    }
  },
  {
    "id": "science-quiz",
    "bn": "সাধারণ বিজ্ঞান",
    "en": "Question Bank & Quiz",
    "path": "bcs/question-bank/bcs_science_quiz.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "keys",
      "keys": [
        "bcs_science_quiz_v1"
      ]
    }
  },
  {
    "id": "math",
    "bn": "গণিত",
    "en": "Study & Revision System",
    "path": "bcs/question-bank/Math_Interactive_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "keys",
      "keys": [
        "bcsMathStudy_v1"
      ]
    }
  },
  {
    "id": "ict",
    "bn": "কম্পিউটার ও তথ্য প্রযুক্তি",
    "en": "Study & Revision System",
    "path": "bcs/question-bank/ICT_Interactive_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "keys",
      "keys": [
        "ictStudySystem_v1"
      ]
    }
  },
  {
    "id": "morality",
    "bn": "নৈতিকতা, মূল্যবোধ ও সুশাসন",
    "en": "Study & Revision System",
    "path": "bcs/question-bank/Morality_Interactive_Study_Revision_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "question-bank",
    "sectionName": "Question Bank — Previous Year Questions",
    "subject": "Question Bank — Previous Year Questions",
    "storage": {
      "type": "keys",
      "keys": [
        "morality_srs_v2"
      ]
    }
  },
  {
    "id": "lal-neel-dipaboli",
    "bn": "লাল নীল দীপাবলি",
    "en": "Exam Prep",
    "path": "bcs/question-bank/Lal_Neel_Dipaboli_Exam_Prep.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Bangla Language & Literature",
    "storage": {
      "type": "keys",
      "keys": [
        "lndp_state_v2"
      ]
    }
  },
  {
    "id": "bangla-bhasha-sahitya",
    "bn": "বাংলা ভাষা ও সাহিত্য জিজ্ঞাসা",
    "en": "BCS Study System",
    "path": "bcs/books/Bangla_Bhasha_Sahitya_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Bangla Language & Literature",
    "storage": {
      "type": "keys",
      "keys": [
        "bcsBanglaStudy_v1"
      ]
    }
  },
  {
    "id": "bangla-sahitya-study-app",
    "bn": "বাংলা ভাষা ও সাহিত্য — স্টাডি অ্যাপ",
    "en": "46th BCS Preliminary Study System",
    "path": "bcs/books/Bangla_Sahitya_Study_App.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Bangla Language & Literature",
    "storage": {
      "type": "keys",
      "keys": [
        "bcsBanglaStudyV1"
      ]
    }
  },
  {
    "id": "vocab-mastery-bcs",
    "bn": "শব্দভাণ্ডার",
    "en": "Vocabulary Mastery",
    "path": "bcs/books/Vocabulary_Mastery.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "English Language & Literature",
    "storage": {
      "type": "keys",
      "keys": [
        "vocabAppState_v1"
      ]
    }
  },
  {
    "id": "english-literature-master",
    "bn": "BCS English Literature",
    "en": "Command Center",
    "path": "bcs/books/BCS_English_Literature_Master.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "English Language & Literature",
    "storage": {
      "type": "keys",
      "keys": [
        "bcsLitApp_v2"
      ]
    }
  },
  {
    "id": "bcs-english-command",
    "bn": "ইংরেজি কমান্ড",
    "en": "Study System",
    "path": "bcs/books/BCS_English_Command_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "English Language & Literature",
    "storage": {
      "type": "keys",
      "keys": [
        "bcsEnglish.v1"
      ]
    }
  },
  {
    "id": "english-lang-lit-study-app",
    "bn": "ইংরেজি ভাষা ও সাহিত্য",
    "en": "BCS Study App",
    "path": "bcs/books/English_Language_Literature_Study_App.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "English Language & Literature",
    "storage": {
      "type": "keys",
      "keys": [
        "english_language_literature_study_v1"
      ]
    }
  },
  {
    "id": "budget-2026-27",
    "bn": "বাজেট FY2026-27",
    "en": "Study Dashboard",
    "path": "bcs/question-bank/BCS_Budget_2026_27_Bangla.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Bangladesh Affairs",
    "storage": {
      "type": "keys",
      "keys": [
        "bcsBudget2627_v1"
      ]
    }
  },
  {
    "id": "bangladesh-constitution-master",
    "bn": "সংবিধানের বেসিক পাঠ",
    "en": "BCS Mastery System",
    "path": "bcs/books/Bangladesh_Constitution_BCS_Master.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Bangladesh Affairs",
    "storage": {
      "type": "keys",
      "keys": [
        "bcs_const_app_v1"
      ]
    }
  },
  {
    "id": "bangladesh-affairs-study-app",
    "bn": "বাংলাদেশ বিষয়াবলি — ওয়ার্কস্টেশন",
    "en": "BCS Preparation Workstation",
    "path": "bcs/books/Bangladesh_Affairs_Study_App.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Bangladesh Affairs",
    "storage": {
      "type": "keys",
      "keys": [
        "bcsStudyState_v1"
      ]
    }
  },
  {
    "id": "international-affairs-study-app",
    "bn": "আন্তর্জাতিক বিষয়াবলি",
    "en": "46th BCS Preliminary",
    "path": "bcs/books/International_Affairs_Study_App.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "International Affairs",
    "storage": {
      "type": "keys",
      "keys": [
        "bcs_intl_affairs_state_v1"
      ]
    }
  },
  {
    "id": "math-short-technique",
    "bn": "গণিতের শর্ট টেকনিক",
    "en": "Competitive Exam Prep",
    "path": "bcs/books/Math_Short_Technique_Exam_Prep.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Mathematical Reasoning & Mental Ability",
    "storage": {
      "type": "keys",
      "keys": [
        "mathmastery_state_v1"
      ]
    }
  },
  {
    "id": "math-mental-ability-study-system",
    "bn": "গণিত — স্টাডি সিস্টেম",
    "en": "46th BCS Preliminary (Pilot: Lectures 01-06)",
    "path": "bcs/books/Math_Mental_Ability_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Mathematical Reasoning & Mental Ability",
    "storage": {
      "type": "keys",
      "keys": [
        "bcsmath_state"
      ]
    }
  },
  {
    "id": "computer-ict-study-system",
    "bn": "কম্পিউটার — স্টাডি সিস্টেম",
    "en": "46th BCS Preliminary",
    "path": "bcs/books/Computer_ICT_Study_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Computer & Information Technology",
    "storage": {
      "type": "keys",
      "keys": [
        "bcsComputerStudyV1"
      ]
    }
  },
  {
    "id": "ethics-values-governance-46th-bcs",
    "bn": "নৈতিকতা, মূল্যবোধ ও সুশাসন (৪৬তম বিসিএস)",
    "en": "Study System",
    "path": "bcs/books/Ethics_Values_Good_Governance_46th_BCS.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Ethics, Values & Good Governance",
    "storage": {
      "type": "keys",
      "keys": [
        "ethics46_bcs_state_v1"
      ]
    }
  },
  {
    "id": "geography-study-app",
    "bn": "ভূগোল — স্টাডি অ্যাপ",
    "en": "46th BCS Preliminary",
    "path": "bcs/books/Geography_Environment_Disaster_Study_App.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "Geography, Environment & Disaster Management",
    "storage": {
      "type": "keys",
      "keys": [
        "geo46_bcs_state_v1"
      ]
    }
  },
  {
    "id": "general-science-46th-bcs",
    "bn": "সাধারণ বিজ্ঞান (৪৬তম বিসিএস)",
    "en": "Preliminary Study System",
    "path": "bcs/books/General_Science_46th_BCS.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "books",
    "sectionName": "BCS Books & Study Materials",
    "subject": "General Science",
    "storage": {
      "type": "keys",
      "keys": [
        "gs46_bcs_state_v1"
      ]
    }
  },
  {
    "id": "prelim-master-tracker",
    "bn": "BCS Preliminary — মাস্টার ট্র্যাকার",
    "en": "Master Tracker",
    "path": "bcs/preliminary-tools/BCS_Preliminary_Master_Tracker.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "syllabus",
    "sectionName": "Syllabus",
    "subject": "Syllabus",
    "storage": {
      "type": "keys",
      "keys": [
        "bcs_master_tracker_v1"
      ]
    }
  },
  {
    "id": "written-syllabus-intelligence",
    "bn": "BCS Written — সিলেবাস ইন্টেলিজেন্স সিস্টেম",
    "en": "Syllabus Intelligence System",
    "path": "bcs/written/BCS_Written_Syllabus_Intelligence_System.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "syllabus",
    "sectionName": "Syllabus",
    "subject": "Syllabus",
    "storage": {
      "type": "keys",
      "keys": [
        "bcsIntel_v1"
      ]
    }
  },
  {
    "id": "bcs50-eligibility",
    "bn": "৫০তম বি.সি.এস — যোগ্যতা বিশ্লেষণ",
    "en": "Eligibility Analysis",
    "path": "bcs/preliminary-tools/bcs50_eligibility.html",
    "category": "bcs",
    "categoryName": "BCS",
    "categoryBn": "বিসিএস",
    "accent": "#8a2b3e",
    "section": "preliminary-tools",
    "sectionName": "BCS Support Tools",
    "subject": "BCS Support Tools",
    "storage": null
  },
  {
    "id": "word-smart-vocabulary",
    "bn": "Word Smart",
    "en": "Vocabulary Mastery",
    "path": "bank/vocabulary/word-smart-vocabulary.html",
    "category": "bank",
    "categoryName": "Bank Preparation",
    "categoryBn": "ব্যাংক প্রস্তুতি",
    "accent": "#166d67",
    "section": "vocabulary",
    "sectionName": "Vocabulary",
    "subject": "Vocabulary",
    "storage": {
      "type": "keys",
      "keys": [
        "wsv_progress_v1",
        "wsv_settings_v1"
      ]
    }
  },
  {
    "id": "khairul-advanced-math",
    "bn": "খায়রুলের অ্যাডভান্সড ম্যাথ",
    "en": "Khairul's Advanced Math",
    "path": "bank/math/Khairuls_Advanced_Math_Study.html",
    "category": "bank",
    "categoryName": "Bank Preparation",
    "categoryBn": "ব্যাংক প্রস্তুতি",
    "accent": "#166d67",
    "section": "bank-math",
    "sectionName": "Math",
    "subject": "Math",
    "storage": {
      "type": "keys",
      "keys": [
        "kam_progress_v1",
        "kam_prefs_v1"
      ]
    }
  },
  {
    "id": "tfp502-exam-tutor",
    "bn": "ইমার্জেন্সি এক্সাম টিউটর",
    "en": "Emergency Exam Tutor",
    "path": "tfp/tfp-502/New_Media_Exam_Tutor.html",
    "category": "tfp",
    "categoryName": "TFP Study Materials",
    "categoryBn": "টিএফপি স্টাডি ম্যাটেরিয়ালস",
    "accent": "#5a3e85",
    "section": "tfp-502",
    "sectionName": "TFP 502 (New Media and Society)",
    "subject": "TFP 502 (New Media and Society)",
    "storage": {
      "type": "keys",
      "keys": [
        "nm_study_state"
      ]
    }
  },
  {
    "id": "tfp503-exam-prep-alt",
    "bn": "এক্সাম প্রেপ (বিকল্প)",
    "en": "Exam Prep (Alt)",
    "path": "tfp/tfp-503/Television_Criticism_Exam_Prep_Alt.html",
    "category": "tfp",
    "categoryName": "TFP Study Materials",
    "categoryBn": "টিএফপি স্টাডি ম্যাটেরিয়ালস",
    "accent": "#5a3e85",
    "section": "tfp-503",
    "sectionName": "TFP 503: Television Criticism",
    "subject": "TFP 503: Television Criticism",
    "storage": {
      "type": "prefix",
      "prefix": "tvx_"
    }
  }
];
