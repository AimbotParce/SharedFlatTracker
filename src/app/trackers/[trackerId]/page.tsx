import { PrismaClient } from "@/generated/prisma"
import OpenInNewPage from "@/icons/OpenInNewPage"
import CreateFlatForm from "./CreateFlatForm"
import StatusSelectionDropdown from "./StatusSelectionDropdown"

const prisma = new PrismaClient()

export default async function TrackerFlats({ params }: { params: { trackerId: string } }) {
    const trackerId = parseInt((await params).trackerId)

    if (isNaN(trackerId)) {
        return <div>Invalid tracker ID</div>
    }

    const tracker = await prisma.tracker.findUnique({
        where: { id: trackerId },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    })

    if (!tracker) {
        return <div>Tracker not found</div>
    }

    const flats = await prisma.flat.findMany({
        where: { trackerId },
        include: {
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    const users = await prisma.user.findMany()

    return (
        <main className="p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold">{tracker.name}</h1>
                <p className="text-gray-600">{tracker.description || "No description"}</p>
                <p className="text-sm text-gray-500">Owner: {tracker.owner.name}</p>
            </div>

            <div>
                <h2 className="text-xl font-bold">Flats ({flats.length})</h2>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Area
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rooms
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Added By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created At
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {flats.map((flat) => (
                            <tr key={flat.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {flat.url ? (
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={flat.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                {flat.name || "Unnamed Flat"}
                                            </a>
                                            <OpenInNewPage className="w-3 h-3 text-blue-600" />
                                        </div>
                                    ) : (
                                        flat.name || "Unnamed Flat"
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {flat.address || "No address"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {flat.price ? `€${flat.price.toLocaleString()}` : "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusSelectionDropdown flat_id={flat.id} default_status={flat.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {flat.area ? `${flat.area} m²` : "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {flat.bedrooms || flat.bathrooms
                                        ? `${flat.bedrooms || 0}bed / ${flat.bathrooms || 0}bath`
                                        : "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {flat.createdBy.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(flat.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {flats.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No flats found in this tracker.</div>
                )}
            </div>

            <hr className="my-8 border-t border-gray-200" />

            <div>
                <h2 className="text-xl font-bold">Add New Flat</h2>
                <CreateFlatForm trackerId={trackerId} users={users} />
            </div>
        </main>
    )
}
