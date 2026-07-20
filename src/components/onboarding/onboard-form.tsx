'use client';

import { useState, useActionState, useEffect } from 'react';
import { submitOnboardingAction } from '@/app/actions/onboarding';
import { Loader2, Landmark, ShieldCheck, User, FileUp, CheckCircle2, ArrowRight } from 'lucide-react';

interface OnboardFormProps {
  token: string;
  defaultEmail: string;
  defaultPhone?: string | null;
}

export default function OnboardForm({ token, defaultEmail, defaultPhone }: OnboardFormProps) {
  const [step, setStep] = useState(1);
  const [aadhaarFiles, setAadhaarFiles] = useState<File[]>([]);
  const [panFiles, setPanFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [academicFiles, setAcademicFiles] = useState<File[]>([]);

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      // Append files and token
      aadhaarFiles.forEach(f => formData.append('file_aadhaar', f));
      panFiles.forEach(f => formData.append('file_pan', f));
      photoFiles.forEach(f => formData.append('file_photo', f));
      academicFiles.forEach(f => formData.append('file_academic', f));

      return submitOnboardingAction(token, formData);
    },
    { success: false, message: '' }
  );

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden font-sans text-sm">
      {/* Progress header */}
      <div className="bg-secondary/40 border-b border-border px-6 py-4 flex justify-between items-center select-none">
        <span className="font-serif font-bold text-foreground text-sm">Step {step} of 4</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                step >= i ? 'bg-primary scale-110' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {state.success ? (
        <div className="p-8 text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto animate-bounce" />
          <h2 className="text-3xl font-serif text-foreground">Submission Received</h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Thank you! Your self-onboarding details and documents have been successfully transmitted. Our Human Resources department will review your submission shortly.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-2">
            You will be contacted by email or phone once your profile is verified and active.
          </p>
        </div>
      ) : (
        <form action={formAction} className="p-6 md:p-8 space-y-8">
          {state.message && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs">
              {state.message}
            </div>
          )}

          {/* STEP 1: Personal Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-serif font-bold text-foreground">Personal Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Full Name *</label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Date of Birth *</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Gender *</label>
                  <select
                    name="gender"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Blood Group</label>
                  <select
                    name="bloodGroup"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Personal Email (Primary) *</label>
                  <input
                    name="personalEmail"
                    type="email"
                    required
                    readOnly
                    value={defaultEmail}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-muted-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Mobile Number *</label>
                  <input
                    name="mobileNumber"
                    type="tel"
                    required
                    defaultValue={defaultPhone || ''}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Addresses & Emergency Contact */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                <MapPinIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-serif font-bold text-foreground">Addresses & Emergency Contacts</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Current Address *</label>
                  <textarea
                    name="currentAddress"
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Current residential location details..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Permanent Address *</label>
                  <textarea
                    name="permanentAddress"
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Permanent hometown address..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Emergency Contact Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Contact Name *</label>
                    <input
                      name="emergencyContactName"
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Contact full name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Contact Number *</label>
                    <input
                      name="emergencyContactNumber"
                      type="tel"
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Contact mobile number"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Relationship *</label>
                    <input
                      name="emergencyContactRelationship"
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. Spouse, Father, Mother"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Banking & Government Identifiers */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                <Landmark className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-serif font-bold text-foreground">Bank & statutory settings</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Bank Name *</label>
                  <input
                    name="bankName"
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. HDFC Bank"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Account Holder Name *</label>
                  <input
                    name="bankAccountHolderName"
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Name as in bank account"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Account Number *</label>
                  <input
                    name="bankAccountNumber"
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    placeholder="Your account number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">IFSC Code *</label>
                  <input
                    name="bankIfscCode"
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    placeholder="11 digit bank IFSC"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">PAN Card Number *</label>
                  <input
                    name="panNumber"
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    placeholder="10 digit PAN"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Aadhaar Card Number *</label>
                  <input
                    name="aadhaarNumber"
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    placeholder="12 digit Aadhaar"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Document Uploads & Acknowledgement */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
                <FileUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-serif font-bold text-foreground">File Uploads</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 border border-border rounded-md bg-secondary/20 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-foreground uppercase">Aadhaar Card Copy *</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Please upload up to 2 files (front and back side scans).</p>
                    {aadhaarFiles.length > 0 && (
                      <p className="text-[10px] text-primary mt-1.5 font-semibold">
                        Selected: {aadhaarFiles.map(f => f.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    required={aadhaarFiles.length === 0}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 2) {
                        alert('You can upload up to 2 files only for Aadhaar Card.');
                        setAadhaarFiles(files.slice(0, 2));
                      } else {
                        setAadhaarFiles(files);
                      }
                    }}
                    className="mt-4 text-xs text-muted-foreground focus:outline-none"
                  />
                </div>

                <div className="p-4 border border-border rounded-md bg-secondary/20 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-foreground uppercase">PAN Card Copy *</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Please upload up to 2 files.</p>
                    {panFiles.length > 0 && (
                      <p className="text-[10px] text-primary mt-1.5 font-semibold">
                        Selected: {panFiles.map(f => f.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    required={panFiles.length === 0}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 2) {
                        alert('You can upload up to 2 files only for PAN Card.');
                        setPanFiles(files.slice(0, 2));
                      } else {
                        setPanFiles(files);
                      }
                    }}
                    className="mt-4 text-xs text-muted-foreground focus:outline-none"
                  />
                </div>

                <div className="p-4 border border-border rounded-md bg-secondary/20 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-foreground uppercase">Passport Photograph *</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Upload up to 2 color portraits.</p>
                    {photoFiles.length > 0 && (
                      <p className="text-[10px] text-primary mt-1.5 font-semibold">
                        Selected: {photoFiles.map(f => f.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    required={photoFiles.length === 0}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 2) {
                        alert('You can upload up to 2 files only for Passport Photograph.');
                        setPhotoFiles(files.slice(0, 2));
                      } else {
                        setPhotoFiles(files);
                      }
                    }}
                    className="mt-4 text-xs text-muted-foreground focus:outline-none"
                  />
                </div>

                <div className="p-4 border border-border rounded-md bg-secondary/20 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-foreground uppercase">Academic Documents *</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Please upload degrees/diplomas (multiple select allowed).</p>
                    {academicFiles.length > 0 && (
                      <p className="text-[10px] text-primary mt-1.5 font-semibold">
                        Selected: {academicFiles.map(f => f.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    required={academicFiles.length === 0}
                    onChange={(e) => setAcademicFiles(Array.from(e.target.files || []))}
                    className="mt-4 text-xs text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="agree"
                  required
                  className="mt-1 accent-primary rounded cursor-pointer"
                />
                <label htmlFor="agree" className="text-xs text-muted-foreground leading-normal cursor-pointer select-none">
                  I hereby declare that all information and scanned attachments uploaded in this onboarding form are true and accurate to the best of my knowledge. I understand that any false documentation will lead to cancellation of my employment offer.
                </label>
              </div>
            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <button
              type="button"
              onClick={prevStep}
              className={`px-4 py-2 border border-border bg-card text-foreground hover:bg-secondary text-sm font-sans font-medium rounded-md transition-colors ${
                step === 1 ? 'pointer-events-none opacity-0' : ''
              }`}
            >
              Previous
            </button>
            
            {step === 4 ? (
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-sans font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Onboarding
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1 px-4 py-2 bg-secondary text-foreground hover:bg-accent border border-border text-sm font-sans font-medium rounded-md transition-colors"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

// Mini custom icons to avoid layout bugs
function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25A7.5 7.5 0 1 1 19.5 10.5Z" />
    </svg>
  );
}
