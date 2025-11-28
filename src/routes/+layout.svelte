<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	let logined = $state(false);

	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { IsLogined, Logout, OnAuthChange } from '$lib/rundown';

	// Optionally set default options here
	const options = {};

	OnAuthChange(() => {
		logined = IsLogined();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="mx-auto flex h-screen w-screen flex-col items-center pb-8">
	<div class="navbar bg-base-100 sticky top-0 shadow-sm">
		<span class="navbar-start">
			<a href="/" class="btn btn-ghost btn-lg">Rundown</a>
		</span>
		<span class="navbar-end gap-2">
			{#if logined}
				<button class="btn btn-ghost" onclick={Logout}>Logout</button>
			{:else}
				<a href="/login" class="btn btn-ghost">Login</a>
			{/if}
		</span>
	</div>

	<div class="flex grow flex-col items-center gap-4 py-8">
		{@render children()}
	</div>
</div>

<SvelteToast {options} />
