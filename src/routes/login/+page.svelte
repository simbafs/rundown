<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginWithOTP } from '$lib/rundown';

	let email = $state('');
	let otp = $state('');
	let sent = $state(false);
	let verify = $state<Awaited<ReturnType<typeof LoginWithOTP>> | null>(null);

	function handleSend(e: SubmitEvent) {
		e.preventDefault();

		console.log({ email });

		LoginWithOTP(email).then((v) => {
			sent = true;
			verify = v;
		});
	}

	function handleVerify(e: SubmitEvent) {
		e.preventDefault();

		console.log({ otp });

		verify?.(otp).then(() => {
			goto('/');
		});
	}
</script>

<h1 class="text-4xl font-bold">登入</h1>

{#if !sent}
	<form class="flex flex-col gap-4" onsubmit={handleSend}>
		<label class="floating-label">
			<span>Email</span>
			<input
				type="email"
				class="input input-bordered w-full"
				bind:value={email}
				placeholder="user@example.com"
				required
			/>
		</label>
		<button class="btn btn-primary w-full">Send Magic Link</button>
	</form>
{:else}
	<form class="flex flex-col gap-4" onsubmit={handleVerify}>
		<label class="floating-label">
			<span>OTP</span>
			<input
				type="text"
				class="input input-bordered w-full"
				bind:value={otp}
				placeholder="12345678"
				required
			/>
		</label>
		<button class="btn btn-primary w-full">Login</button>
	</form>
{/if}

<div class="">有帳號了嗎？<a href="/register" class="link">👉註冊👈</a></div>
