import GerantForm from '@/components/gerant-form';
import authOptions from '@/lib/auth';
import dbConnection from '@/lib/db';
import User from '@/models/User.model';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

const Pages = async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      redirect("/");
    }
    await dbConnection()
    let business = []

    if (session?.user?.role === "gerant") {
        const rep = await User
            .findById(session.user.id)
            .select("businesses")
            .populate({ 
                path: "businesses",
                select: "_id name",
                options: { lean: true } 
            })

        business = rep.businesses.map(b => ({
            id: b._id.toString(),
            name: b.name,
        }))
    }

    return (
        <>
            {session?.user?.role === "admin"
            ? (<>admin</>)
            : (
                <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                    <div className="w-full max-w-md">
                        <GerantForm business={business}/>
                    </div>
                </div>
            )
            }
        </>
    );
}

export default Pages;
