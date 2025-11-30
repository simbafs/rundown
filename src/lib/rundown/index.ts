import pocketbase, { type OnStoreChangeFunc } from 'pocketbase';
import {
	Collections,
	type ActivityResponse,
	type EventRecord,
	type EventResponse,
	type TypedPocketBase,
	type UserRecord,
	type UserResponse,
} from './pocketbase.ts';

const pb = new pocketbase('http://localhost:8090') as TypedPocketBase;

////////////////////
// Authentication //
////////////////////

export async function Register(
	username: string,
	email: string,
	password: string,
	passwordConfirm: string,
) {
	return pb
		.collection(Collections.User)
		.create<UserResponse>({
			username,
			email,
			password,
			passwordConfirm,
		})
		.then(() => pb.collection(Collections.User).requestVerification(email));
}

/**
 * @example
 *  LoginWithOTP('user@example.com')
 *    .then(verify => verify('12345678'))
 *    .then(user => console.log(user));
 */
export async function LoginWithOTP(email: string) {
	return pb
		.collection(Collections.User)
		.requestOTP(email)
		.then((req) => {
			return (otp: string) =>
				pb.collection(Collections.User).authWithOTP<UserResponse>(req.otpId, otp);
		});
}

export function Logout() {
	pb.authStore.clear();
}

export function IsLogined() {
	return pb.authStore.isValid;
}

export function OnAuthChange(cb: OnStoreChangeFunc) {
	pb.authStore.onChange(cb, true);
}

export function GetCurrentUID() {
	return pb.authStore.record?.id || '';
}

export function ListUser() {
	return pb.collection(Collections.User).getFullList<UserRecord>();
}

export async function ListAndSubscribeUser(cb: (users: UserRecord[]) => void) {
	if (!IsLogined()) throw ErrUnauthroized;

	let users = await ListUser();
	cb(users);

	return pb.collection(Collections.User).subscribe('*', (e) => {
		const id = e.record.id;

		switch (e.action) {
			case 'create':
				users = [...users, e.record];
				break;
			case 'update':
				users = users.map((u) => (u.id === id ? e.record : u));
				break;
			case 'delete':
				users = users.filter((u) => u.id !== id);
				break;
		}
		users = users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
		cb(users);
	});
}

export const ErrUnauthroized = new Error('Unauthorized');

//////////////
// Activity //
//////////////

export type ExpandedActivityResponse = ActivityResponse<{
	owner: UserRecord;
	member: UserRecord[];
}>;

export async function ListActivity() {
	return pb
		.collection(Collections.Activity)
		.getFullList<ExpandedActivityResponse>({ sort: '+created', expand: 'owner,member' });
}

export async function ListAndSubscribeActivity(cb: (events: ExpandedActivityResponse[]) => void) {
	if (!IsLogined()) throw ErrUnauthroized;

	let activities = await ListActivity();
	cb(activities);

	return pb.collection(Collections.Activity).subscribe<ExpandedActivityResponse>(
		'*',
		(e) => {
			const id = e.record.id;

			switch (e.action) {
				case 'create':
					activities = [...activities, e.record];
					break;
				case 'update':
					activities = activities.map((ev) => (ev.id === id ? e.record : ev));
					break;
				case 'delete':
					activities = activities.filter((ev) => ev.id !== id);
					break;
			}
			activities = activities.sort((a, b) => Date.parse(a.created) - Date.parse(b.created));
			cb(activities);
		},
		{ expand: 'owner,member' },
	);
}

export async function GetActivity(aid: string) {
	return pb
		.collection(Collections.Activity)
		.getOne<ExpandedActivityResponse>(aid, { expand: 'owner,member' });
}

export async function CreateActivity(name: string) {
	if (!IsLogined()) throw ErrUnauthroized;

	const owner = pb.authStore.record?.id;
	if (!owner) throw ErrUnauthroized;
	return pb
		.collection(Collections.Activity)
		.create<ExpandedActivityResponse>({ name, owner }, { expand: 'owner,member' });
}

export async function AddMember(aid: string, uid: string) {
	if (!IsLogined()) throw ErrUnauthroized;

	return pb.collection(Collections.Activity).update<ExpandedActivityResponse>(
		aid,
		{
			'member+': [uid],
		},
		{ expand: 'owner,member' },
	);
}

export async function RemoveMember(aid: string, uid: string) {
	if (!IsLogined()) throw ErrUnauthroized;

	return pb.collection(Collections.Activity).update<ExpandedActivityResponse>(
		aid,
		{
			'member-': [uid],
		},
		{
			expand: 'owner,member',
		},
	);
}

export async function TransferOwnership(aid: string, uid: string) {
	if (!IsLogined()) throw ErrUnauthroized;

	const activity = await pb.collection(Collections.Activity).getOne<ActivityResponse>(aid);
	pb.collection(Collections.Activity).update<ExpandedActivityResponse>(
		aid,
		{
			owner: uid,
			'member+': [activity.owner],
			'member-': [uid],
		},
		{
			expand: 'owner,member',
		},
	);
}

export async function CanEdit(aid: string, uid: string) {
	if (!IsLogined()) return false;

	return pb
		.collection(Collections.Activity)
		.getOne<ActivityResponse>(aid)
		.then((activity) => activity.owner === uid || activity.member.includes(uid))
		.catch(() => false);
}

///////////
// Event //
///////////

export async function ListEvent(aid: string) {
	return pb.collection(Collections.Event).getFullList<EventResponse>({
		filter: `activity = "${aid}"`,
		sort: '+start',
	});
}

export async function ListAndSubscribeEvent(aid: string, cb: (events: EventRecord[]) => void) {
	if (!IsLogined()) throw ErrUnauthroized;

	let events = await ListEvent(aid);
	cb(events);
	let ids = new Set(events.map((e) => e.id));

	return pb.collection(Collections.Event).subscribe('*', (e) => {
		let updated = false;
		const id = e.record.id;

		switch (e.action) {
			case 'create':
				if (e.record.activity != aid) break;
				events = [...events, e.record];
				ids.add(id);
				updated = true;
				break;
			case 'update':
				if (e.record.activity == aid) {
					if (ids.has(id)) {
						// update existing
						events = events.map((ev) => (ev.id === id ? e.record : ev));
					} else {
						// new record for this activity
						events = [...events, e.record];
						ids.add(id);
					}
					updated = true;
				} else if (ids.has(id)) {
					// removed from this activity
					events = events.filter((ev) => ev.id !== id);
					ids.delete(id);
					updated = true;
				}
				break;
			case 'delete':
				if (e.record.activity != aid) break;
				events = events.filter((ev) => ev.id !== id);
				ids.delete(id);
				updated = true;
				break;
		}
		if (updated) {
			events = events.sort((a, b) => (a.start || 0) - (b.start || 0));
			cb(events);
		}
	});
}

export async function CreateEvent(aid: string, data: Partial<EventRecord>) {
	if (!IsLogined()) throw ErrUnauthroized;

	return pb.collection(Collections.Event).create<EventResponse>({ ...data, activity: aid });
}

export async function UpdateEvent(eid: string, data: Partial<EventRecord>) {
	if (!IsLogined()) throw ErrUnauthroized;

	return pb.collection(Collections.Event).update<EventResponse>(eid, data);
}

export async function ResetEventDone(eids: string[]) {
	if (!IsLogined()) throw ErrUnauthroized;

	// send multiple update requests in parallel
	return Promise.all(
		eids.map((eid) => pb.collection(Collections.Event).update<EventResponse>(eid, { done: false })),
	);
}

export async function DeleteEvent(eid: string) {
	if (!IsLogined()) throw ErrUnauthroized;

	return pb.collection(Collections.Event).delete(eid);
}

function timeToMinutes(time: Date) {
	return time.getHours() * 60 + time.getMinutes();
}

export async function GetCurrentEvent(aid: string, now = new Date()) {
	// TODO: this function need to be updated
	const nowMinutes = timeToMinutes(now);

	return pb
		.collection(Collections.Event)
		.getFirstListItem<EventResponse>(`start < ${nowMinutes} && activit = "${aid}"`, {
			sort: '-start',
		})
		.catch(() =>
			pb
				.collection(Collections.Event)
				.getFirstListItem<EventResponse>(`activity = "${aid}"`, { sort: '+start' }),
		);
}

// IsEventReady returns true if the event is going to begin in 5 minutes
export function IsEventReady(e: EventRecord, now = new Date()) {
	const nowMinutes = timeToMinutes(now);
	const start = e.start || 0;

	return start - nowMinutes <= 5 && start - nowMinutes > 0;
}

// IsEventOngoing returns true if the event is ongoing
export function IsEventOngoing(e: EventRecord, now = new Date()) {
	const nowMinutes = timeToMinutes(now);
	const start = e.start || 0;
	const end = e.end || 0;

	return nowMinutes >= start && nowMinutes < end;
}

// IsEventDone returns true if the event is marked as done or the end time has passed
export function IsEventDone(e: EventRecord, now = new Date()) {
	const nowMinutes = timeToMinutes(now);
	const end = e.end || 0;

	return e.done === true && nowMinutes >= end;
}

// IsEventTimeout returns true if the event is not marked as done and the end time has passed
export function IsEventTimeout(e: EventRecord, now = new Date()) {
	const nowMinutes = timeToMinutes(now);
	const end = e.end || 0;

	return e.done !== true && nowMinutes >= end;
}

export function EventProgress(e: EventRecord, now = new Date()) {
	if (IsEventDone(e, now) || IsEventTimeout(e, now)) {
		return 1;
	}

	if (!IsEventOngoing(e, now)) {
		return 0;
	}

	const nowMinutes = timeToMinutes(now);
	const start = e.start || 0;
	const end = e.end || 0;

	return (nowMinutes - start) / (end - start);
}
