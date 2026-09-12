export default {
  async fetch(): Promise<Response> {
    return Response.json(
      {
        retired: true,
        message: "MASTER LANGUAGE SYSTEM fue retirado por su propietario.",
      },
      { status: 410, headers: { "cache-control": "no-store" } },
    );
  },
};
