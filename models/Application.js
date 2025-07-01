const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true 
  },
  employer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    lowercase: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  currentUniversity: { 
    type: String, 
    required: true 
  },
  majorIn: { 
    type: String, 
    required: true 
  },
  country: { 
    type: String, 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  CGPA: { 
    type: Number, 
    required: true 
  },
  coverLetter: { 
    type: String, 
    default: '' 
  },
  resume: { 
    data: Buffer, 
    contentType: String, 
    filename: String 
  },
  atsScore: { 
    type: Number, 
    default: 0 
  },
  appliedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Application', applicationSchema);
