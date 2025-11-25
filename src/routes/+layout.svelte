<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { setEditContext } from '$lib/context';
	import { supabase } from '$lib/supabase';

	let { children } = $props();

	const { title = 'Rundown' } = page.data;

	const edit = $state({
		checked: false,
	});

	let logined = $state(false);

	setEditContext(edit);

	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Optionally set default options here
	const options = {};

	onMount(() => {
		supabase.auth.getUser().then(({ data, error }) => {
			if (error) {
				// not login
				goto('/login');
				return;
			}
			const { user } = data;

			logined = true;

			console.log({ user });
		});
	});

	function logout() {
		supabase.auth.signOut().finally(() => {
			goto('/login');
		});
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{title}</title>
</svelte:head>

<div class="bg-base-200 mx-auto flex h-screen w-screen flex-col items-center gap-8 pb-8">
	<div class="navbar bg-base-100 shadow-sm">
		<span class="navbar-start">
			<a href="/" class="btn btn-ghost btn-lg">Rundown</a>
		</span>
		<span class="navbar-end gap-2">
			{#if logined}
				<label class="label">
					<input
						type="checkbox"
						class="toggle toggle-primary"
						checked={edit.checked}
						onchange={(e) => (edit.checked = e.currentTarget.checked)}
					/>
					Edit
				</label>

				<button class="btn btn-ghost" onclick={logout}>Logout</button>
			{/if}
		</span>
	</div>

	<div class="card bg-base-100 min-h-1 min-w-3/5 gap-y-4 p-4 shadow-lg">
		{@render children()}
	</div>
</div>

<SvelteToast {options} />
