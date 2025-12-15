import ItemCompare from '@/components/item/item-compare';

export default async function ComparePage({
    params,
}: {
    params: Promise<{ mid: string }>;
}) {
    const { mid } = await params;

    return <ItemCompare mid={mid} />;
}
