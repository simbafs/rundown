<script lang="ts">
	import {
		AddMember,
		CreateActivity,
		GetCurrentUID,
		ListAndSubscribeActivity,
		ListAndSubscribeUser,
		RemoveMember,
		TransferOwnership,
		type ExpandedActivityResponse,
	} from '$lib/rundown';
	import type { UserRecord } from '$lib/rundown/pocketbase';
	import { errorToast, infoToast } from '$lib/toast';

	let activities = $state<ExpandedActivityResponse[]>([]);
	let selected = $state(0);
	let activity = $derived<ExpandedActivityResponse | undefined>(activities[selected]);

	$effect(() => {
		const unsub = ListAndSubscribeActivity((a) => {
			activities = a;
		}).catch((err) => {
			errorToast(`Failed to load activities: ${err.message}`);
		});

		return () => {
			unsub.then((u) => u?.()).then(console.log, console.error);
		};
	});

	let users = $state<UserRecord[]>([]);
	let usersMap = $derived(new Map(users.map((u) => [u.id, u])));
	$effect(() => {
		const unsub = ListAndSubscribeUser((u) => (users = u)).catch((err) => {
			errorToast(`Failed to load users: ${err.message}`);
		});

		return () => {
			unsub.then((u) => u?.()).then(console.log, console.error);
		};
	});

	let newActivityName = $state('');
	function newActivity(e: SubmitEvent) {
		e.preventDefault();

		CreateActivity(newActivityName)
			.then(() => {
				infoToast(`已建立活動 ${newActivityName}`);
				newActivityName = '';
			})
			.catch((err) => {
				errorToast(`建立活動失敗: ${err.message}`);
			});
	}

	let newMemberID = $state('');
	function newMember(e: SubmitEvent) {
		e.preventDefault();

		if (!activity) return;

		AddMember(activity.id, newMemberID)
			.then(() => {
				infoToast(`已新增成員 ${usersMap.get(newMemberID)?.name}`);
				newMemberID = '';
			})
			.catch((err) => {
				errorToast(`新增成員失敗: ${err.message}`);
			});
	}
</script>

<h1 class="text-4xl font-bold">活動</h1>

<div class="w-full md:w-2/3">
	<ul class="list">
		<li class="p-4 pb-2 text-xs tracking-wide opacity-60">你所在的活動</li>
		{#each activities as activity, i}
			<li class="list-row">
				<button
					class={[
						'list-col-grow rounded-field hover:bg-secondary/10 cursor-pointer px-2 text-left transition-colors',
						{ 'bg-secondary/20': selected == i },
					]}
					onclick={() => (selected = i)}
				>
					{activity.name}
				</button>
				<button class="btn btn-secondary" type="button" disabled>匯出</button>
			</li>
		{/each}
		<li class="list-row">
			<form class="join" onsubmit={newActivity}>
				<label class="floating-label list-col-grow w-full">
					<span>新活動名字</span>
					<input
						type="text"
						class="input join-item w-full"
						placeholder="SITCON 2026 R0"
						bind:value={newActivityName}
						required
					/>
				</label>
				<button class="btn btn-primary join-item" type="submit">建立新活動</button>
			</form>
			<button class="btn btn-secondary" type="button" disabled>匯入</button>
		</li>
	</ul>

	<div class="divider"></div>

	{#if activity}
		<h2 class="text-center text-3xl font-semibold">{activity.name}</h2>
		<ul class="list">
			<li class="list-row">
				<div>Owner: <span class="font-bold">{activity.expand.owner.name}</span></div>
			</li>
			{#each activity.expand.member as member}
				<li class="list-row">
					<div class="list-col-grow ml-4 font-bold">{member.name}</div>
					{#if activity.owner == GetCurrentUID()}
						<button
							class="btn btn-info"
							type="button"
							onclick={() =>
								TransferOwnership(activity.id, member.id).then(() =>
									infoToast(`已將 ${activity.name} 所有權轉移給 ${member.name}`),
								)}>轉移所有權</button
						>
						<button
							class="btn btn-error"
							type="button"
							onclick={() =>
								RemoveMember(activity.id, member.id).then(() =>
									infoToast(`已經從 ${activity.name} 移除 ${member.name}`),
								)}>移除</button
						>
					{/if}
				</li>
			{/each}

			{#if activity.owner == GetCurrentUID()}
				<li class="list-row grid-cols-1 gap-0">
					<form class="join w-full" onsubmit={newMember}>
						<label class="floating-label w-full">
							<span>Username</span>
							<select class="select join-item w-full" bind:value={newMemberID} required>
								{@debug users}
								{#each users.filter((u) => u.name) as u}
									<option value={u.id}>{u.name}</option>
								{/each}
							</select>
						</label>

						<button class="btn btn-primary join-item" type="submit">新增成員</button>
					</form>
				</li>
			{/if}
		</ul>
	{/if}
</div>
