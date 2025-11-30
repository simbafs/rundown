<script lang="ts">
	import { Register } from '$lib/rundown';

	let username = $state('');
	let email = $state('');
	let password = $state('');
	let password_confirm = $state('');

	let loading = $state(false);
	let sent = $state(false);
	let error = $state('');

	function register(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		Register(username, email, password, password_confirm)
			.then(() => {
				sent = true;
			})
			.catch((err) => {
				error = `註冊失敗: ${err.message}`;
			})
			.finally(() => {
				loading = false;
			});
	}
</script>

<h1 class="text-4xl font-bold">註冊</h1>

<form class="flex flex-col gap-4 inert:opacity-50" onsubmit={register} inert={sent}>
	<label class="floating-label">
		<span>Username</span>
		<input type="text" bind:value={username} class="input w-full" placeholder="username" required />
	</label>
	<label class="floating-label">
		<span>Email</span>
		<input
			type="email"
			bind:value={email}
			class="input w-full"
			placeholder="user@example.com"
			required
		/>
	</label>
	<label class="floating-label">
		<span>Password(min length 8)</span>
		<input
			type="password"
			bind:value={password}
			class="input w-full"
			placeholder="password"
			minlength="8"
			required
		/>
	</label>
	<label class="floating-label">
		<span>Confirm Password(min length 8)</span>
		<input
			type="password"
			bind:value={password_confirm}
			class="input w-full"
			placeholder="confirm password"
			minlength="8"
			pattern={password}
			required
		/>
	</label>
	<button type="submit" class="btn btn-primary"
		>{#if loading}<span class="loading loading-spinner"
			></span>{:else if sent}請收信{:else}發送註冊信件{/if}</button
	>
</form>

<div class="">沒有帳號？<a href="/login" class="link">👉登入👈</a></div>

{#if sent}
	<div role="alert" class="alert alert-success alert-soft">
		<span>已註冊，請前往電子郵箱查看驗證信件</span>
	</div>
{/if}

{#if error}
	<div role="alert" class="alert alert-error alert-soft">
		<span>{error}</span>
	</div>
{/if}
