import dbConnection from '@/lib/db'
import { withAuth } from '@/utils/withAuth'
import DailyReport from '@/models/DailyReport.Model'
import { NextResponse } from 'next/server'

export const GET = withAuth(async (req) => {
  try {
    await dbConnection()

    const { searchParams } = new URL(req.url)
    const page  = parseInt(searchParams.get('page')  || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const from  = searchParams.get('from')  // ISO date string
    const to    = searchParams.get('to')    // ISO date string

    const filter = { gerant: { $exists: true } }
    if (from || to) {
      filter.date = {}
      if (from) filter.date.$gte = new Date(from)
      if (to)   filter.date.$lte = new Date(to)
    }

    const total = await DailyReport.countDocuments(filter)
    const docs  = await DailyReport.find(filter)
      .populate('business', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return NextResponse.json(
      { success: true, error: false, data: { docs, total, page, limit } },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erreur GET /api/daily-reports :', err)
    return NextResponse.json(
      { success: false, error: true, message: 'Impossible de récupérer les rapports journaliers.' },
      { status: 500 }
    )
  }
})
