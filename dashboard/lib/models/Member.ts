import mongoose, { Schema } from 'mongoose';

export interface IWarn {
  reason: string;
  by: string;
  at: string;
}

export interface IJail {
  reason: string;
  jailedBy: string;
  timestamp: string;
  rolesSnapshot: string[];
}

export interface IStaffStats {
  verificationsDone: number;
  jailsDone: number;
}

export interface ITimeoutLog {
  reason: string;
  by: string;
  at: string;
  duration: string;
}

export interface ISas {
  active: boolean;
  by: string | null;
  at: string | null;
}

export interface IMember {
  _id: string;
  xp: number;
  voiceXp: number;
  lastMsg: number;
  lastDailyClaim: number;
  warns: IWarn[];
  jail: IJail | null;
  sas: ISas | null;
  staffStats: IStaffStats;
  timeouts: ITimeoutLog[];
}

const warnSchema = new Schema<IWarn>(
  { reason: String, by: String, at: String },
  { _id: false }
);

const jailSchema = new Schema<IJail>(
  { reason: String, jailedBy: String, timestamp: String, rolesSnapshot: [String] },
  { _id: false }
);

const staffStatsSchema = new Schema<IStaffStats>(
  { verificationsDone: { type: Number, default: 0 }, jailsDone: { type: Number, default: 0 } },
  { _id: false }
);

const timeoutLogSchema = new Schema<ITimeoutLog>(
  { reason: String, by: String, at: String, duration: String },
  { _id: false }
);

const sasSchema = new Schema<ISas>(
  { active: { type: Boolean, default: false }, by: { type: String, default: null }, at: { type: String, default: null } },
  { _id: false }
);

const memberSchema = new Schema<IMember>({
  _id:            { type: String, required: true },
  xp:             { type: Number, default: 0 },
  voiceXp:        { type: Number, default: 0 },
  lastMsg:        { type: Number, default: 0 },
  lastDailyClaim: { type: Number, default: 0 },
  warns:          { type: [warnSchema],      default: [] },
  jail:           { type: jailSchema,        default: null },
  sas:            { type: sasSchema,         default: null },
  staffStats:     { type: staffStatsSchema,  default: () => ({ verificationsDone: 0, jailsDone: 0 }) },
  timeouts:       { type: [timeoutLogSchema], default: [] },
});

export const Member =
  (mongoose.models.Member as mongoose.Model<IMember>) ??
  mongoose.model<IMember>('Member', memberSchema);
