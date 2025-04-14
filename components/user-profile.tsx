"use client"

import { useState } from "react"
import { X, Save, User, Settings, Trophy, BarChart3 } from "lucide-react"
import { useUser } from "@/contexts/user-context"

export default function UserProfile({ onClose }: { onClose: () => void }) {
  const { user, updateUsername, updateAvatar, updateSettings } = useUser()
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "stats">("profile")
  const [username, setUsername] = useState(user.username)
  const [avatar, setAvatar] = useState(user.avatar)
  const [settings, setSettings] = useState(user.settings)

  const avatarOptions = ["👾", "🚀", "💎", "🌕", "🐻", "🦍", "🤖", "📈", "🔥", "🧠", "🦊", "🐂"]

  const handleSave = () => {
    updateUsername(username)
    updateAvatar(avatar)
    updateSettings(settings)
    onClose()
  }

  return (
    <div className="bg-black border border-green-500/30 rounded-sm w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-3 bg-green-500/10 border-b border-green-500/30">
        <div className="text-sm font-bold">USER_PROFILE</div>
        <button onClick={onClose} className="p-1 hover:bg-green-500/20 rounded">
          <X size={16} />
        </button>
      </div>

      <div className="flex border-b border-green-500/30">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center py-2 px-4 text-xs font-semibold ${
            activeTab === "profile" ? "bg-green-500/20 text-green-400" : "hover:bg-green-500/10"
          }`}
        >
          <User size={14} className="mr-1" />
          PROFILE
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex items-center py-2 px-4 text-xs font-semibold ${
            activeTab === "stats" ? "bg-green-500/20 text-green-400" : "hover:bg-green-500/10"
          }`}
        >
          <Trophy size={14} className="mr-1" />
          STATS
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center py-2 px-4 text-xs font-semibold ${
            activeTab === "settings" ? "bg-green-500/20 text-green-400" : "hover:bg-green-500/10"
          }`}
        >
          <Settings size={14} className="mr-1" />
          SETTINGS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "profile" && (
          <div>
            <div className="mb-4">
              <label className="text-xs text-green-500/70 block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-green-500/30 rounded px-3 py-2"
                maxLength={20}
              />
            </div>

            <div className="mb-4">
              <label className="text-xs text-green-500/70 block mb-1">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {avatarOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setAvatar(option)}
                    className={`w-10 h-10 text-xl flex items-center justify-center rounded ${
                      avatar === option
                        ? "bg-green-500/30 border border-green-500"
                        : "bg-green-500/10 hover:bg-green-500/20"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-green-500/70 mb-1">Member Since</div>
              <div>{user.joinDate.toLocaleDateString()}</div>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-500/5 p-3 rounded border border-green-500/20">
                <div className="text-xs text-green-500/70">Level</div>
                <div className="text-xl font-bold">{user.stats.level}</div>
                <div className="text-xs mt-1">
                  XP: {user.stats.xp}/{user.stats.level * 100}
                </div>
                <div className="w-full h-1 bg-green-500/20 mt-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${((user.stats.xp % 100) / 100) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-green-500/5 p-3 rounded border border-green-500/20">
                <div className="text-xs text-green-500/70">Trades</div>
                <div className="text-xl font-bold">{user.stats.trades}</div>
                <div className="text-xs mt-1">Win Rate: {user.stats.winRate}%</div>
              </div>

              <div className="bg-green-500/5 p-3 rounded border border-green-500/20">
                <div className="text-xs text-green-500/70">Avg Return</div>
                <div className="text-xl font-bold">+{user.stats.avgReturn}%</div>
                <div className="text-xs mt-1">Per Trade</div>
              </div>

              <div className="bg-green-500/5 p-3 rounded border border-green-500/20">
                <div className="text-xs text-green-500/70">Best Trade</div>
                <div className="text-xl font-bold text-green-400">+{user.stats.bestTrade}%</div>
                <div className="text-xs mt-1">Worst: {user.stats.worstTrade}%</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-green-500/70 mb-2">Badges</div>
              <div className="flex flex-wrap gap-2">
                {user.stats.badges.map((badge, i) => (
                  <div key={i} className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs">
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-green-500/70 mb-2">Performance Chart</div>
              <div className="h-40 bg-green-500/5 rounded border border-green-500/20 flex items-center justify-center">
                <BarChart3 size={24} className="text-green-500/50 mr-2" />
                <span className="text-xs text-green-500/50">Performance data visualization</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <div className="mb-4">
              <label className="text-xs text-green-500/70 block mb-1">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
                className="w-full bg-black border border-green-500/30 rounded px-3 py-2"
              >
                <option value="default">Default</option>
                <option value="synthwave">Synthwave</option>
                <option value="terminal">Terminal</option>
                <option value="hacker">Hacker</option>
              </select>
            </div>

            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="notifications" className="text-sm">
                  Enable Notifications
                </label>
              </div>

              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="soundEffects"
                  checked={settings.soundEffects}
                  onChange={(e) => setSettings({ ...settings, soundEffects: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="soundEffects" className="text-sm">
                  Sound Effects
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={settings.autoRefresh}
                  onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="autoRefresh" className="text-sm">
                  Auto-Refresh Data
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-green-500/70 block mb-1">Refresh Interval (seconds)</label>
              <input
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => setSettings({ ...settings, refreshInterval: Number.parseInt(e.target.value) })}
                className="w-full bg-black border border-green-500/30 rounded px-3 py-2"
                min="10"
                max="300"
              />
            </div>

            <div>
              <div className="text-xs text-green-500/70 mb-1">Data Privacy</div>
              <div className="text-xs text-green-500/50">
                All data is stored locally in your browser. No data is sent to external servers.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-green-500/30 flex justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm mr-2">
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm bg-green-500/20 hover:bg-green-500/30 rounded flex items-center"
        >
          <Save size={14} className="mr-1" />
          Save Changes
        </button>
      </div>
    </div>
  )
}
