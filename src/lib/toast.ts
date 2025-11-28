import { toast } from '@zerodevx/svelte-toast';

export function infoToast(msg: string) {
	console.log(msg);
	toast.push(msg, {
		theme: {
			'--toastBackground': '#2196F3',
			'--toastColor': 'white',
			'--toastBarBackground': '#0b7dda',
		},
	});
}

export function errorToast(msg: string) {
	console.error(msg);
	toast.push(msg, {
		theme: {
			'--toastBackground': '#f44336',
			'--toastColor': 'white',
			'--toastBarBackground': '#ba000d',
		},
	});
}
