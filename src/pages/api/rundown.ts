// src/pages/api/rundown.ts
import type { APIRoute } from 'astro'

interface EventItem {
	name: string
	start: string
	end: string
	room: string
}

export const GET: APIRoute = async ({ url, locals }) => {
	const room = url.searchParams.get('room') || 'R0'

	// Cloudflare Worker 的環境變數
	const env = locals.runtime.env
	const csvUrl = env.SPREADSHEET_CSV_URL
	if (!csvUrl) {
		return json({ error: 'SPREADSHEET_CSV_URL not configured' }, 500)
	}

	let res: Response
	try {
		res = await fetch(csvUrl)
	} catch (err) {
		return json({ error: 'Failed to fetch sheet', detail: String(err) }, 500)
	}

	if (!res.ok) {
		return json({ error: 'Failed to fetch sheet', status: res.status }, 500)
	}

	const csv = await res.text()
	const events = parseCsv(csv, room)

	return json({ events })
}

function json(obj: unknown, status = 200): Response {
	return new Response(JSON.stringify(obj), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
		},
	})
}

// 假設欄位：A=名稱, B=開始, C=結束, D=地點
function parseCsv(csvText: string, room: string): EventItem[] {
	const lines = csvText
		.split(/\r?\n/)
		.map(l => l.trim())
		.filter(l => l.length > 0)

	if (lines.length <= 1) return []

	const events: EventItem[] = []

	for (let i = 1; i < lines.length; i++) {
		const cols = lines[i].split(',')
		const [name, start, end, place] = [cols[0] ?? '', cols[1] ?? '', cols[2] ?? '', cols[3] ?? ''].map(c =>
			c.trim(),
		)

		if (!name) continue
		if (room && place && place !== room) continue

		events.push({ name, start, end, room: place })
	}

	return events
}
