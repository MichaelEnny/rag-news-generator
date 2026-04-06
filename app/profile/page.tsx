import { AppShell } from "@/components/app-shell";
import { saveProfileAction } from "@/app/actions";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";

export default async function ProfilePage() {
  const user = await requireAuthenticatedUser();
  const data = await getDashboardData(user);
  const profile = data.profile;

  return (
    <AppShell currentPath="/profile" userLabel={user.email || user.name}>
      <section className="page-header">
        <div>
          <p className="eyebrow">Personalization</p>
          <h2>Profile settings</h2>
        </div>
        <p className="muted">These settings drive ranking and email tone across the app.</p>
      </section>

      <form action={saveProfileAction} className="panel settings-form">
        <div className="settings-grid">
          <label className="field">
            <span>Name</span>
            <input name="name" defaultValue={profile.name} />
          </label>
          <label className="field">
            <span>Title</span>
            <input name="title" defaultValue={profile.title} />
          </label>
          <label className="field field-full">
            <span>Background</span>
            <textarea name="background" defaultValue={profile.background} rows={4} />
          </label>
          <label className="field">
            <span>Expertise level</span>
            <input name="expertiseLevel" defaultValue={profile.expertiseLevel} />
          </label>
          <label className="field">
            <span>Delivery email</span>
            <input name="deliveryEmail" type="email" defaultValue={profile.deliveryEmail} />
          </label>
          <label className="field">
            <span>Digest window hours</span>
            <input name="digestWindowHours" type="number" min="1" max="168" defaultValue={profile.digestWindowHours} />
          </label>
          <label className="field">
            <span>Top N stories</span>
            <input name="topN" type="number" min="1" max="20" defaultValue={profile.topN} />
          </label>
          <label className="field field-full">
            <span>Interests, one per line</span>
            <textarea name="interests" defaultValue={profile.interests.join("\n")} rows={8} />
          </label>
        </div>

        <div className="preference-grid">
          {Object.entries(profile.preferences).map(([key, value]) => (
            <label key={key} className="checkbox-row">
              <input name={key} type="checkbox" defaultChecked={value} />
              <span>{key}</span>
            </label>
          ))}
        </div>

        <div className="form-footer">
          <button className="button" type="submit">
            Save profile
          </button>
        </div>
      </form>
    </AppShell>
  );
}
