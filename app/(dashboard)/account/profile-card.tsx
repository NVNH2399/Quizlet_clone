"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export default function ProfileCard({
  stats,
}: {
  stats: { totalSets: number; totalCards: number; totalVideos: number };
}) {
  const { user, isLoaded } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!isLoaded || !user) {
    return <div className="border rounded-2xl p-5 bg-white animate-pulse h-40" />;
  }

  function startEditing() {
    setFirstName(user!.firstName ?? "");
    setLastName(user!.lastName ?? "");
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    await user!.update({ firstName, lastName });
    setSaving(false);
    setEditing(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    await user!.setProfileImage({ file });
    setUploadingAvatar(false);
  }

  return (
    <div className="border rounded-2xl p-5 bg-white">
      <div className="flex items-center gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAvatar}
          className="relative group"
        >
          <img
            src={user.imageUrl}
            alt="avatar"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition">
            {uploadingAvatar ? "..." : "Đổi ảnh"}
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        <div className="flex-1">
          {!editing ? (
            <>
              <p className="font-semibold text-lg">
                {user.fullName || "Chưa đặt tên"}
              </p>
              <p className="text-sm text-gray-400">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </>
          ) : (
            <div className="flex gap-2">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Họ"
                className="border rounded-lg p-1.5 text-sm w-1/2"
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Tên"
                className="border rounded-lg p-1.5 text-sm w-1/2"
              />
            </div>
          )}
        </div>

        {!editing ? (
          <button
            onClick={startEditing}
            className="text-sm text-brand font-medium hover:underline"
          >
            Sửa
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand text-white text-sm px-3 py-1.5 rounded-full disabled:opacity-50"
            >
              {saving ? "..." : "Lưu"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-gray-400"
            >
              Hủy
            </button>
          </div>
        )}
      </div>

      {/* Thống kê nhanh — tận dụng dữ liệu đã có, tạo cảm giác "hồ sơ cá nhân" đầy đủ hơn */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t">
        <div className="text-center">
          <p className="text-xl font-bold text-brand">{stats.totalSets}</p>
          <p className="text-xs text-gray-400">Bộ từ vựng</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-brand">{stats.totalCards}</p>
          <p className="text-xs text-gray-400">Thẻ từ</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-brand">{stats.totalVideos}</p>
          <p className="text-xs text-gray-400">Video</p>
        </div>
      </div>
    </div>
  );
}