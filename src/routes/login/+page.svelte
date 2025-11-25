<script lang="ts">
	import type { MyEvent } from '$lib/event';
	import { supabase } from '$lib/supabase';
	import { errorToast } from '$lib/toast';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// 狀態管理
	let emailSent = $state(false); // 追蹤是否已發送 Email
	let email = $state(''); // 使用者輸入的 Email
	let token = $state(''); // 使用者輸入的 OTP/Token
	let loading = $state(false); // 全域載入狀態

	/**
	 * 處理 Email 登入：發送 OTP 連結/代碼到使用者 Email
	 * @param e 表單提交事件
	 */
	async function login(e: MyEvent<SubmitEvent, HTMLFormElement>) {
		e.preventDefault();
		loading = true;

		const redirectTo = `${window.location.origin}/login`;

		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				shouldCreateUser: true,
				emailRedirectTo: redirectTo,
			},
		});

		loading = false;

		if (error) {
			console.error(error);
			errorToast(error.message);
		} else {
			emailSent = true;
			// 提示使用者檢查信箱
			// 這裡可以加入 successToast 提示，但為簡潔暫略
		}
	}

	/**
	 * 處理 Token 驗證：使用者手動輸入 OTP 代碼
	 * @param e 表單提交事件
	 */
	async function verify(e: MyEvent<SubmitEvent, HTMLFormElement>) {
		e.preventDefault();
		loading = true;

		const { error } = await supabase.auth.verifyOtp({
			token,
			email,
			type: 'email',
		});

		loading = false;

		if (error) {
			console.error(error);
			errorToast(error.message);
		} else {
			// 驗證成功，導向首頁
			goto('/');
		}
	}

	/**
	 * 在元件掛載時檢查 URL 參數，處理 Email 連結重導向的自動驗證
	 */
	onMount(() => {
		const param = new URLSearchParams(window.location.search);
		const token_hash = param.get('token_hash');

		if (!token_hash) return;

		// 避免重複載入
		loading = true;

		supabase.auth
			.verifyOtp({
				token_hash: token_hash,
				type: 'email',
			})
			.then(({ error }) => {
				loading = false; // 無論成功或失敗，結束載入狀態
				if (error) {
					console.error('Email 連結驗證失敗:', error);
					errorToast(error.message);
					// 移除 URL 中的參數，保持 /login 頁面乾淨
					history.replaceState({}, document.title, window.location.pathname);
				} else {
					// 驗證成功，導向首頁
					goto('/');
				}
			});
	});
</script>

<h1 class="card-title mb-6 justify-center text-2xl">🔐 登入</h1>

<label class="label">
	<input type="checkbox" class="toggle toggle-primary" bind:checked={emailSent} />
	{#if emailSent}
		重新輸入 Email Address
	{:else}
		我已經有 Token
	{/if}
</label>

{#if loading}
	<div class="flex items-center justify-center">
		<span class="loading loading-spinner loading-lg text-primary"></span>
		<p class="ml-4">驗證中，請稍候...</p>
	</div>
{:else if emailSent}
	<p class="mb-4 text-center text-sm">
		請檢查您的信箱 (包含垃圾郵件匣)，點擊連結進行登入，或手動輸入下方代碼。
	</p>
{/if}

{#if !emailSent}
	<form onsubmit={login} class="flex flex-col gap-4">
		<div class="form-control w-full">
			<label class="floating-label">
				<span class="label-text">Email Address</span>
				<input
					bind:value={email}
					type="email"
					placeholder="me@example.com"
					class="input w-full"
					required
				/>
			</label>
		</div>

		<button type="submit" class="btn btn-primary mt-4 w-full" disabled={loading}>
			{#if loading}
				<span class="loading loading-spinner"></span>
				傳送中
			{:else}
				發送登入連結
			{/if}
		</button>
	</form>
{:else}
	<form onsubmit={verify} class="flex flex-col gap-4">
		<div class="form-control w-full">
			{#if email}
				<span class="label-text-alt text-gray-500">已寄送至 {email}</span>
			{/if}
			<label class="floating-label">
				<span class="label-text">一次性密碼 (OTP) 代碼</span>
				<input
					bind:value={token}
					type="text"
					placeholder="輸入您收到的代碼"
					class="input w-full"
					required
				/>
			</label>
		</div>
		<button type="submit" class="btn btn-success mt-4 w-full" disabled={loading}>
			{#if loading}
				<span class="loading loading-spinner"></span>
				驗證中
			{:else}
				驗證並登入
			{/if}
		</button>
	</form>
{/if}

<div class="mt-6 text-center text-xs text-gray-500">
	<p>我們使用無密碼 (Passwordless) 登入技術。</p>
</div>
