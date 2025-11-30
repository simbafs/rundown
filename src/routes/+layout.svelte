<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	let logined = $state(false);

	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { GetCurrentUID, IsLogined, Logout, OnAuthChange } from '$lib/rundown';
	import { user } from '$lib/auth.svelte';

	// Optionally set default options here
	const options = {};

	OnAuthChange(() => {
		logined = IsLogined();
		if (logined) {
			user.uid = GetCurrentUID();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-screen flex-col items-center overflow-x-hidden pb-8">
	<div class="navbar bg-base-100 sticky top-0 shadow-sm">
		<span class="navbar-start">
			<a href="/" class="btn btn-ghost btn-lg">Rundown</a>
		</span>
		<span class="navbar-end gap-2">
			{#if logined}
				<a href="/activities" class="btn btn-ghost">活動</a>
				<button class="btn btn-ghost" onclick={Logout}>登出</button>
			{:else}
				<a href="/login" class="btn btn-ghost">登入</a>
			{/if}
		</span>
	</div>

	<div class="flex w-full grow flex-col items-center gap-4 p-8">
		{@render children()}
	</div>
</div>

<SvelteToast {options} />
