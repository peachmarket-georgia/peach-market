/**
 * 🍑 피치마켓 홈 피드
 * 
 * 조지아 한인 중고거래 플랫폼의 메인 페이지입니다.
 */

const HomePage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-orange-500">🍑 피치마켓</h1>
        <span className="text-sm text-gray-600">둘루스, GA</span>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          주변 매물
        </h2>
        
        {/* 상품 그리드 - 추후 구현 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 샘플 상품 카드 */}
          <div className="overflow-hidden bg-white rounded-lg shadow-md">
            <div className="h-32 bg-gray-200" />
            <div className="p-3">
              <span className="inline-block px-2 py-1 mb-2 text-xs font-medium text-green-800 bg-green-100 rounded">
                판매중
              </span>
              <p className="text-sm font-medium text-gray-800 truncate">
                샘플 상품
              </p>
              <p className="text-sm font-bold text-orange-500">$50</p>
            </div>
          </div>
          
          <div className="overflow-hidden bg-white rounded-lg shadow-md">
            <div className="h-32 bg-gray-200" />
            <div className="p-3">
              <span className="inline-block px-2 py-1 mb-2 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                예약중
              </span>
              <p className="text-sm font-medium text-gray-800 truncate">
                샘플 상품 2
              </p>
              <p className="text-sm font-bold text-orange-500">$30</p>
            </div>
          </div>
        </div>
      </div>

      {/* 플로팅 버튼 */}
      <button className="fixed flex items-center justify-center w-14 h-14 text-2xl text-white bg-orange-500 rounded-full shadow-lg bottom-20 right-4 hover:bg-orange-600">
        +
      </button>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around py-3 bg-white border-t border-gray-200">
        <button className="flex flex-col items-center text-orange-500">
          <span className="text-xl">🏠</span>
          <span className="text-xs">홈</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-xl">🔍</span>
          <span className="text-xs">검색</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-xl">💬</span>
          <span className="text-xs">채팅</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-xl">❤️</span>
          <span className="text-xs">관심</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-xl">👤</span>
          <span className="text-xs">MY</span>
        </button>
      </nav>
    </main>
  );
};

export default HomePage;
