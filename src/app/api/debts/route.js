import dbConnection from "@/lib/db";
import DailyReport from "@/models/DailyReport.Model";
import Business from "@/models/Business.Model";
import { NextResponse } from "next/server";
import { withAuth } from "@/utils/withAuth";

export const GET = withAuth(async (req) => {
  try {
    await dbConnection();
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const typeParam = (searchParams.get('type') || 'all').toLowerCase(); // 'all' | 'dette' | 'reglement'
    let start, end;

    if (startParam && endParam) {
      start = new Date(startParam);
      end = new Date(endParam);
      end.setHours(23,59,59,999);
    } else {
      const now = new Date();
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
    }

    const pipelines = [];

    if (typeParam === 'all' || typeParam === 'dette') {
      pipelines.push(
        DailyReport.aggregate([
          { $match: { date: { $gte: start, $lte: end } } },
          { $unwind: '$debts' },
          { $lookup: {
              from: 'businesses',
              localField: 'business',
              foreignField: '_id',
              as: 'business'
          }},
          { $unwind: '$business' },
          { $project: {
              reportId: '$_id', // ✅ id du rapport
              type: { $literal: 'dette' },
              date: '$date',
              business: '$business.name',
              numeroFacture: '$debts.ref',
              description: '$debts.description',
              total: '$debts.total'
          }}
        ])
      );
    }

    if (typeParam === 'all' || typeParam === 'reglement') {
      pipelines.push(
        DailyReport.aggregate([
          { $match: { date: { $gte: start, $lte: end } } },
          { $unwind: '$reglementDebts' },
          { $lookup: {
              from: 'businesses',
              localField: 'business',
              foreignField: '_id',
              as: 'business'
          }},
          { $unwind: '$business' },
          { $project: {
              reportId: '$_id', // ✅ id du rapport
              type: { $literal: 'reglement' },
              date: '$date',
              business: '$business.name',
              numeroFacture: '$reglementDebts.ref',
              description: '$reglementDebts.description',
              total: '$reglementDebts.total'
          }}
        ])
      );
    }

    const results = await Promise.all(pipelines.map(p => p));
    const data = results.flat().sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({
      data,
      success: true,
      error: false
    }, { status: 200 });

  } catch (error) {
    console.error("Erreur lors de la récupération des dettes: ", error);
    return NextResponse.json({
      message: "Erreur! Veuillez réessayer.",
      success: false,
      error: true
    }, { status: 500 });
  }
});
