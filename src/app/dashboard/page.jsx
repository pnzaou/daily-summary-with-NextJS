import GerantForm from '@/components/gerant-form';
import authOptions from '@/lib/auth';
import dbConnection from '@/lib/db';
import User from '@/models/User.model';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import "@/models/Business.Model"
import Header from '@/components/header';
import { preparingServerSideRequest } from '@/utils/preparingServerRequest';
import AdminHome from '@/components/admin-home';
import RapportFormCompta from '@/components/comptable-form';


const Pages = async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      redirect("/");
    }
    await dbConnection()
    let business = []
    let daisyReport = {}

    if (session?.user?.role === "admin") {
        const { cookie, host, protocol } = await preparingServerSideRequest()
        const res = await fetch(`${protocol}://${host}/api/dashboard-data`, {
            headers: {
                cookie,
            },
        })

        const { data } = await res.json()
        daisyReport = data
    }

    if (session?.user?.role === "gerant" || session?.user?.role === "comptable") {
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
            <Header userName={session.user.name} />
            {session?.user?.role === "admin" &&
             (<>
                <AdminHome reportData={ daisyReport }/>
            </>)}
            {session?.user?.role === "gerant" && (
                <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 mt-16 md:mt-0">
                    <div className="w-full max-w-md">
                        <GerantForm business={business}/>
                    </div>
                </div>
            )}
            {session?.user?.role === "comptable" && (
                <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 mt-16 md:mt-6">
                    <div className="w-full max-w-xl">
                        <RapportFormCompta business={business}/>
                    </div>
                </div>
            )}
        </>
    );
}

export default Pages;
