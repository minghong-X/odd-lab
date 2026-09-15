import { Story } from "@/components/story";
import { getServerArtifacts } from "@/lib/server-artifacts";
import { getPhotoWall, experiments } from "@/lib/catalog";
export default async function Home() {
  const all = (
    await Promise.all(experiments.map((e) => getServerArtifacts(e.slug)))
  ).flat();
  return (
    <main id="main" className="home-screen">
      <Story
        pictures={getPhotoWall(30, all).map((a) => ({
          id: a.id,
          mediaUrl: a.mediaUrl,
          mediaType: a.mediaType,
        }))}
      />
    </main>
  );
}
