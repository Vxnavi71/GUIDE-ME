import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Phone,
  Globe,
  UserPlus,
  AlertTriangle,
  HeartHandshake,
  CheckCircle,
  ExternalLink,
  LifeBuoy,
} from 'lucide-react';
import { ApiService } from '../services/api';

export const SafetyCenterPage: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [alertData, setAlertData] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const list = await ApiService.listEmergencyContacts();
      setContacts(list || []);
    } catch (e) {
      console.error('Failed to load emergency contacts:', e);
    }
  };

  const handleTriggerSOS = async () => {
    if (confirm('Are you sure you want to trigger emergency safety support? This will log an acute crisis status and connect you with immediate medical and mental health hotlines.')) {
      try {
        const res = await ApiService.triggerEmergencyAlert();
        setAlertData(res);
        setAlertTriggered(true);
      } catch (e) {
        alert('Could not record alert.');
      }
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await ApiService.addEmergencyContact({
        name,
        relationship,
        phone_number: phoneNumber,
        email: email || undefined,
        notify_on_distress: false,
      });
      setContacts([...contacts, created]);
      setName('');
      setRelationship('');
      setPhoneNumber('');
      setEmail('');
      setShowAddModal(false);
    } catch (e) {
      alert('Could not add contact.');
    }
  };

  const verifiedIndiaHelplines = [
    {
      category: 'National Mental Health (Govt. of India)',
      name: 'Tele-MANAS (Tele Mental Health Programme)',
      phone: '14416 / 1800-891-4416',
      telLink: 'tel:14416',
      details: 'Toll-free 24/7 confidential counseling across 20+ Indian languages managed by NIMHANS and Govt. of India.',
      badge: '24/7 Toll-Free',
    },
    {
      category: 'Psychosocial Support Helpline',
      name: 'KIRAN Mental Health Helpline',
      phone: '1800-599-0019',
      telLink: 'tel:18005990019',
      details: 'Department of Empowerment of Persons with Disabilities (DEPwD), offering 24/7 early screening, psychological first-aid, and distress intervention.',
      badge: '24/7 Toll-Free',
    },
    {
      category: 'Crisis Counseling & Suicide Prevention',
      name: 'Vandrevala Foundation Helpline',
      phone: '+91 9999 666 555',
      telLink: 'tel:+919999666555',
      details: 'Experienced clinical psychologists and professional mental health counselors available 24/7/365 at no cost.',
      badge: '24/7 Clinical Support',
    },
    {
      category: 'Immediate Emergency Services',
      name: 'National Emergency Helpline (India)',
      phone: '112',
      telLink: 'tel:112',
      details: 'Unified national emergency helpline for immediate Police, Ambulance, and Fire response in situations of acute physical danger.',
      badge: 'Police / Medical',
    },
    {
      category: 'Suicide Prevention Helpline',
      name: 'AASRA Helpline',
      phone: '+91 98204 66726',
      telLink: 'tel:+919820466726',
      details: '24/7 non-judgmental emotional support and active crisis intervention for persons feeling suicidal or deeply distressed.',
      badge: '24/7 NGO Hotline',
    },
    {
      category: 'Premier Neuropsychiatric Care',
      name: 'NIMHANS Psychosocial Helpline',
      phone: '080-46110007',
      telLink: 'tel:08046110007',
      details: 'National Institute of Mental Health and Neuro Sciences specialized clinical consultation and mental health support.',
      badge: 'Clinical Referral',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Crisis De-escalation & Safety Center</span>
          </div>
          <h1 className="text-xl font-bold text-rose-950 dark:text-rose-100">
            Immediate Help & Human Support
          </h1>
          <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 max-w-2xl">
            If you are in acute distress, experiencing thoughts of self-harm, or feeling unsafe, please reach out to professional human crisis services. You do not have to endure this alone.
          </p>
        </div>

        <button
          onClick={handleTriggerSOS}
          className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Trigger Urgent SOS Support</span>
        </button>
      </div>

      {alertTriggered && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
              <span className="font-bold text-sm text-rose-700 dark:text-rose-300">
                Escalation Status: Medical Assistance Required
              </span>
            </div>
            <button
              onClick={() => setAlertTriggered(false)}
              className="text-xs font-bold text-earth-500 hover:text-earth-800 dark:text-sage-400 hover:underline"
            >
              Dismiss Notice
            </button>
          </div>
          <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            A safety alert has been recorded in your audit log. For your physical and emotional safety, please connect immediately with one of the verified 24/7 crisis hotlines below or call 112 if in immediate danger.
          </p>
        </div>
      )}

      {/* Verified India Crisis Resources */}
      <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100 mb-1 flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-sage-600 dark:text-sage-400" />
          <span>Verified Crisis & Mental Health Resources (India)</span>
        </h2>
        <p className="text-xs text-earth-500 dark:text-sage-400 mb-4">
          Direct, toll-free, and confidential 24/7 support lines operated by medical institutions, clinical foundations, and government mental health authorities.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {verifiedIndiaHelplines.map((h, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-earth-200 dark:border-forest-800 bg-earth-50/50 dark:bg-forest-800/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-earth-500 dark:text-sage-400">
                    {h.category}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {h.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-forest-900 dark:text-sage-100">{h.name}</h3>
                <p className="text-xs text-earth-600 dark:text-sage-300 mt-1 leading-relaxed">{h.details}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-earth-100 dark:border-forest-800 flex items-center justify-between">
                <a
                  href={h.telLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call: {h.phone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trusted Emergency Contacts */}
      <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-sage-600 dark:text-sage-400" />
              <span>Trusted Personal Emergency Contacts</span>
            </h2>
            <p className="text-xs text-earth-500 dark:text-sage-400">
              Personal contacts who can be notified or reached if you encounter elevated emotional distress.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>

        {contacts.length === 0 ? (
          <p className="text-xs text-earth-500 dark:text-sage-400 p-6 border border-dashed border-earth-200 dark:border-forest-800 rounded-xl text-center">
            No personal emergency contacts added yet. Click "Add Contact" above to add family, friends, or your clinician.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-earth-200 dark:border-forest-800 bg-earth-50/50 dark:bg-forest-800/40"
              >
                <h3 className="text-sm font-semibold text-forest-900 dark:text-sage-100">{c.name}</h3>
                <span className="text-[11px] text-sage-700 dark:text-sage-300 font-medium block">{c.relationship}</span>
                <div className="mt-2 text-xs text-earth-600 dark:text-sage-300 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-earth-400" />
                    <a href={`tel:${c.phone_number}`} className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline">
                      {c.phone_number}
                    </a>
                  </div>
                  {c.email && (
                    <div className="text-[11px] text-earth-500 dark:text-sage-400 truncate">
                      {c.email}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-forest-900 border border-earth-200 dark:border-forest-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-base font-semibold text-forest-950 dark:text-sage-100">Add Trusted Contact</h2>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Aarav Sharma"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Relationship</label>
                <input
                  type="text"
                  required
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Friend, Mentor, Partner, Clinician..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-earth-700 dark:text-sage-300 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-earth-300 dark:border-forest-700 bg-white dark:bg-forest-800 text-earth-900 dark:text-sage-100 outline-none focus:ring-1 focus:ring-sage-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-earth-300 dark:border-forest-700 text-xs font-medium text-earth-700 dark:text-sage-300 hover:bg-earth-50 dark:hover:bg-forest-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

