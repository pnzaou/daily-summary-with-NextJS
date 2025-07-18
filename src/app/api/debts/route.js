import dbConnection from "@/lib/db";
import DailyReport from "@/models/DailyReport.Model";
import Business from "@/models/Business.Model";
import { withAuthAndRole } from "@/utils/withAuthAndRole";
import { NextResponse } from "next/server";

export const GET = withAuthAndRole(async (req) => {
    try {
        await dbConnection()
        const { searchParams } = new URL(req.url);
        const startParam = searchParams.get('start');
        const endParam = searchParams.get('end');
        let start, end;

        if (startParam && endParam) {
            start = new Date(startParam);
            end = new Date(endParam);
            // inclure la fin de journée
            end.setHours(23,59,59,999);
        } else {
            // par défaut, aujourd'hui
            const now = new Date();
            start = new Date(now.setHours(0, 0, 0, 0));
            end = new Date(now.setHours(23, 59, 59, 999));
        }

        const [debts, reglements] = await Promise.all([
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
                _id: 0,
                type: { $literal: 'dette' },
                date: '$date',
                business: '$business.name',
                numeroFacture: '$debts.numeroFacture',
                description: '$debts.description',
                total: '$debts.total'
            }}
            ]),
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
                _id: 0,
                type: { $literal: 'reglement' },
                date: '$date',
                business: '$business.name',
                numeroFacture: '$reglementDebts.numeroFacture',
                description: '$reglementDebts.description',
                total: '$reglementDebts.total'
            }}
            ])
        ]);

        const data = [...debts, ...reglements]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        return NextResponse.json({
            data,
            success: true,
            error: false
        }, { status: 200 })

    } catch (error) {
        console.error("Erreur lors de la récupération des dettes: ", error)
        return NextResponse.json({
            message: "Erreur! Veuillez réessayer.",
            success: false,
            error: true
        }, { status: 500 })
    }
}) 