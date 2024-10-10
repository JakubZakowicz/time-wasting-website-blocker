# import asyncio
# from mitmproxy import http
# from mitmproxy.tools.dump import DumpMaster
# from mitmproxy.options import Options
#
# class WebsiteLogger:
#     def __init__(self):
#         self.last_website = None
#
#     def request(self, flow: http.HTTPFlow) -> None:
#         if flow.request.method == "GET":
#             url = flow.request.pretty_url
#             if url != self.last_website:
#                 print(f"Visited: {url}")
#                 self.last_website = url
#
# async def start_proxy(host, port):
#     options = Options(listen_host=host, listen_port=port)
#     master = DumpMaster(options)
#     master.addons.add(WebsiteLogger())
#
#     await master.run()
#
# if __name__ == "__main__":
#     HOST = "127.0.0.1"
#     PORT = 8080
#
#     print(f"Starting proxy server on {HOST}:{PORT}")
#     print("Please configure your browser to use this proxy.")
#     print("Press Ctrl+C to stop the server.")
#
#     try:
#         asyncio.run(start_proxy(HOST, PORT))
#     except KeyboardInterrupt:
#         print("Proxy server stopped.")

import asyncio
from mitmproxy.tools import dump
from mitmproxy import ctx, http, options


class WebsiteLogger:
    def request(self, flow: http.HTTPFlow) -> None:
        url = flow.request.pretty_url
        print(f"Requested: {url}")


async def start_proxy(host, port):
    opts = options.Options(
        listen_host=host,
        listen_port=port,
    )
    opts.add_option("termlog_verbosity", str, "error", "Log verbosity")
    opts.add_option("flow_detail", int, 0, "Fl ow detail")

    master = dump.DumpMaster(
        opts,
        with_termlog=False,
        with_dumper=False
    )

    master.addons.add(WebsiteLogger())

    await master.run()
    return master


async def main():
    HOST = "127.0.0.1"
    PORT = 8080

    print(f"Starting proxy server on {HOST}:{PORT}")
    print("Please configure your browser to use this proxy.")
    print("Press Ctrl+C to stop the server.")

    master = await start_proxy(HOST, PORT)

    try:
        await asyncio.Event().wait()  # Run forever
    except KeyboardInterrupt:
        print("Proxy server stopped.")
    finally:
        await master.shutdown()


if __name__ == "__main__":
    asyncio.run(main())