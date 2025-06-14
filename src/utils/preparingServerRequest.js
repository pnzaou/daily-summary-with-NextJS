import { headers } from "next/headers";

export const preparingServerSideRequest = async () => {
    const host = (await headers()).get('host')
    const cookie = (await headers()).get('cookie')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

    return { host, cookie, protocol }
}