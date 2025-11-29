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

export const ErrUnauthroized = new Error('Unauthorized');

//////////////
// Activity //
//////////////

export type ExpandedActivityResponse = ActivityResponse<{
	owner: UserRecord;
	member: UserRecord[];
}>;

export async function ListActivity(page = 1) {
	return pb
		.collection(Collections.Activity)
		.getList<ExpandedActivityResponse>(page, 50, { sort: '-created', expand: 'owner,member' });
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

export async function AddAdmin(aid: string, uid: string) {
	if (!IsLogined()) throw ErrUnauthroized;

	return pb.collection(Collections.Activity).update<ExpandedActivityResponse>(
		aid,
		{
			'member+': [uid],
		},
		{ expand: 'owner,member' },
	);
}

export async function RemoveAdmin(aid: string, uid: string) {
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

export async function CreateEvent(aid: string, data: Partial<EventRecord>) {
	if (!IsLogined()) throw ErrUnauthroized;

	return pb.collection(Collections.Event).create<EventResponse>({ ...data, activity: aid });
}

export async function UpdateEvent(eid: string, data: Partial<EventRecord>) {
	if (!IsLogined()) throw ErrUnauthroized;

	return pb.collection(Collections.Event).update<EventResponse>(eid, data);
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
